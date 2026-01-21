import React from 'react';
import TextToSpeechPage from './TextToSpeechPage';

// For now reuse TextToSpeech UI but title differs; we can wrap and pass props if needed
export default function TextToPodcastPage() {
  return (
    <div style={{padding:20}}>
      <h2>🎙️ Text To Podcast</h2>
      <p>This page uses the same UI as Text-to-Speech but will produce podcast-formatted audio.</p>
      <TextToSpeechPage />
    </div>
  );
}
