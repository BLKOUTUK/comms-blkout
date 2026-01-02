/**
 * Google Gemini Veo 2 - Video Generation Service
 * Image-to-Video using Veo model
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.VITE_GEMINI_API || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY required');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function generateVideoFromImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  try {
    console.log('🎬 Generating video with Gemini Veo 3.1...');

    // Use Veo 3.1 for I2V
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      image: {
        bytesBase64Encoded: imageBase64,
        mimeType: 'image/png'
      }
    });

    console.log('⏳ Video generation started, polling for completion...');

    // Poll operation until done (Veo takes 2-5 minutes per video)
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

      const status = await ai.operations.get({ name: operation.name });

      if (status.done) {
        // Extract video URL
        const videoUrl = status.response?.video?.url;
        if (!videoUrl) {
          throw new Error('No video URL in completed operation');
        }

        console.log('✅ Video generated!');
        return videoUrl;
      }

      if (status.error) {
        throw new Error(`Veo error: ${status.error.message}`);
      }

      attempts++;
      if (attempts % 12 === 0) {
        console.log(`⏳ Still generating... (${attempts * 5}s elapsed)`);
      }
    }

    throw new Error('Timeout waiting for video');
  } catch (error: any) {
    console.error('❌ Gemini Veo failed:', error.message);
    throw error;
  }
}
