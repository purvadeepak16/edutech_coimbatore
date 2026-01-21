import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS
import uuid
import traceback

# Windows espeak fix
os.environ["PHONEMIZER_ESPEAK_PATH"] = r"C:\Program Files\eSpeak NG\espeak-ng.exe"
os.environ["ESPEAK_PATH"] = r"C:\Program Files\eSpeak NG\espeak-ng.exe"

app = Flask(__name__)

# 🔧 Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5000", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# 🎙️ Initialize TTS model
try:
    tts = TTS(
        model_name="tts_models/en/ljspeech/vits",
        progress_bar=False,
        gpu=False
    )
    print("✅ TTS model loaded successfully")
except Exception as e:
    print(f"❌ Failed to load TTS model: {e}")
    traceback.print_exc()
    tts = None

AUDIO_DIR = "generated_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

@app.route("/tts", methods=["POST", "OPTIONS"])
def text_to_speech():
    # Handle OPTIONS request for CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text")

        if not text:
            return jsonify({"error": "Text is required"}), 400

        if not tts:
            return jsonify({"error": "TTS model not loaded"}), 500

        # Generate unique filename
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(AUDIO_DIR, filename)

        print(f"🎤 Generating audio for text: {text[:100]}...")
        
        # Generate audio file
        tts.tts_to_file(text=text, file_path=filepath)

        # Return audio URL that will be accessed via /audio/<filename>
        audio_url = f"http://127.0.0.1:5001/audio/{filename}"
        
        print(f"✅ Audio generated: {filename}")
        
        return jsonify({
            "success": True,
            "filename": filename,
            "url": audio_url
        }), 200

    except Exception as e:
        print(f"❌ TTS Error: {e}")
        traceback.print_exc()
        return jsonify({
            "error": "TTS generation failed",
            "details": str(e)
        }), 500

@app.route("/audio/<filename>", methods=["GET", "OPTIONS"])
def serve_audio(filename):
    """Serve generated audio files"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        # Validate filename to prevent path traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            return jsonify({"error": "Invalid filename"}), 400
        
        return send_from_directory(AUDIO_DIR, filename)
    except Exception as e:
        print(f"❌ Error serving audio: {e}")
        return jsonify({"error": "Audio file not found"}), 404

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "tts_model_loaded": tts is not None,
        "audio_directory": os.path.abspath(AUDIO_DIR)
    }), 200

if __name__ == "__main__":
    print("🚀 Starting TTS Service on http://127.0.0.1:5001")
    print("📁 Audio files stored in:", os.path.abspath(AUDIO_DIR))
    app.run(port=5001, debug=False)
