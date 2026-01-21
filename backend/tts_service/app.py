import os
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS
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
# Using VITS for high-quality single-speaker synthesis (already downloaded)
MODEL_NAME = "tts_models/en/ljspeech/vits"

try:
    tts = TTS(
        model_name=MODEL_NAME,
        progress_bar=False,
        gpu=False
    )
    print("✅ TTS model loaded successfully:", MODEL_NAME)
    if hasattr(tts, "speakers") and tts.speakers:
        print("👥 Available speakers:", len(tts.speakers))
    else:
        print("ℹ️  Single-speaker model (dialogue will be concatenated without voice variation)")
except Exception as e:
    print(f"❌ Failed to load TTS model: {e}")
    traceback.print_exc()
    tts = None

AUDIO_DIR = "generated_audio"
BASE_URL = "http://127.0.0.1:5001"
os.makedirs(AUDIO_DIR, exist_ok=True)


def concat_wavs(wav_files, output_path):
    """Concatenate wav files (normalize params to first file)."""
    import wave
    if not wav_files:
        raise ValueError("No wav files to concatenate")

    # Use first file's params as the standard
    with wave.open(wav_files[0], 'rb') as first:
        standard_params = first.getparams()
        frames = [first.readframes(first.getnframes())]

    for path in wav_files[1:]:
        with wave.open(path, 'rb') as wf:
            # If params differ, we still concatenate but use standard params
            # This handles slight variations in generated audio
            file_frames = wf.readframes(wf.getnframes())
            frames.append(file_frames)

    with wave.open(output_path, 'wb') as out:
        out.setparams(standard_params)
        for fr in frames:
            out.writeframes(fr)


@app.route("/tts", methods=["POST", "OPTIONS"])
def text_to_speech():
    # Handle OPTIONS request for CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    if not tts:
        return jsonify({"error": "TTS model not loaded"}), 500

    data = request.get_json(silent=True) or {}
    text = data.get("text")
    dialogue = data.get("dialogue")

    if not text and not dialogue:
        return jsonify({"error": "'text' or 'dialogue' is required"}), 400

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"tts_{timestamp}.wav"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        if dialogue and isinstance(dialogue, list):
            segments = []
            # Gender-based voice characteristics using speed variation
            # Teacher (female) - higher pitch effect via faster speed
            # Student (male) - lower pitch effect via slower speed
            voice_config = {
                "teacher": {"speed": 1.15},   # Slightly faster = perceived higher pitch
                "student": {"speed": 0.85},   # Slightly slower = perceived lower pitch
            }
            
            for idx, entry in enumerate(dialogue):
                role = (entry.get("role") or "").lower()
                segment_text = (entry.get("text") or "").strip()
                if not segment_text:
                    continue

                config = voice_config.get(role, {})
                speed = config.get("speed", 1.0)
                
                seg_name = f"seg_{timestamp}_{idx}.wav"
                seg_path = os.path.join(AUDIO_DIR, seg_name)
                app.logger.info(f"Synth segment {idx}: role={role}, speed={speed}, text={segment_text[:50]}...")
                
                # Generate audio
                tts.tts_to_file(text=segment_text, file_path=seg_path)
                
                # Apply speed adjustment for gender distinction
                if speed != 1.0:
                    import librosa
                    import soundfile as sf
                    import numpy as np
                    from scipy import signal
                    try:
                        # Load audio with proper dtype handling
                        y, sr = librosa.load(seg_path, sr=None, mono=True)
                        y = y.astype(np.float64)  # Convert to float64 for processing
                        
                        # Use librosa's time_stretch with proper handling
                        y_speed = librosa.effects.time_stretch(y, rate=speed)
                        
                        # Save with proper dtype
                        sf.write(seg_path, y_speed.astype(np.float32), sr)
                        app.logger.info(f"Applied speed adjustment {speed}x to segment {idx}")
                    except Exception as e:
                        app.logger.warning(f"Speed adjustment failed, using original: {str(e)}")
                        # Continue with original audio if adjustment fails
                    
                segments.append(seg_path)

            if not segments:
                return jsonify({"error": "No valid dialogue segments"}), 400

            concat_wavs(segments, filepath)

            for seg in segments:
                try:
                    os.remove(seg)
                except OSError:
                    app.logger.warning(f"Could not remove temp segment {seg}")
        else:
            tts.tts_to_file(text=text, file_path=filepath)

        audio_url = f"{BASE_URL}/audio/{filename}"
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
