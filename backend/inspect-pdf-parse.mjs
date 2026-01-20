import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log('Module type:', typeof pdf);
console.log('Module keys:', Object.keys(pdf));
console.log('\nTrying to call pdf() directly:');
console.log('typeof pdf():', typeof pdf);

// Try with a sample buffer
const sampleBuffer = Buffer.from('%PDF-1.4 sample');
try {
  console.log('\nCalling pdf(buffer)...');
  const result = await pdf(sampleBuffer);
  console.log('Success! Result:', result);
} catch (e) {
  console.log('Error calling pdf(buffer):', e.message);
}
