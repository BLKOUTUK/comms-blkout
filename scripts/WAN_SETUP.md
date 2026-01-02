# Wan 2.6 API Setup for Theory of Change

## Getting Your fal.ai API Key

1. Go to https://fal.ai/dashboard/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key

## Configure API Key

Add to `/home/robbe/blkout-platform/apps/comms-blkout/.env`:

```bash
FAL_KEY=your_actual_fal_api_key_here
```

## Test the API

Run a test generation:

```bash
cd /home/robbe/blkout-platform/apps/comms-blkout
FAL_KEY=your_key_here npx tsx scripts/test-wan-api.ts
```

## Wan 2.6 Capabilities

### Text-to-Image
- Generate X-Men 97 style concept art
- Resolutions: 512x512, 1024x1024, 1920x1080
- Aspect ratios: 1:1, 16:9, 9:16

### Image-to-Video
- Animate static images with 60-90s narratives
- Resolutions: 720p, 1080p
- Durations: 5s, 10s, 15s
- Native audio with lip-sync

### Text-to-Video
- Generate videos directly from prompts
- Perfect for Cards 18 & 34 (the two video segments)
- X-Men 97 animation style with dramatic lighting

## Generation Workflow

1. **Images** (Cards 1-40): Use Wan T2I for X-Men 97 style stills
2. **Videos** (Cards 18 & 34): Use Wan T2V or I2V for animated sequences
3. **Unified Style**: Same model ensures consistent X-Men 97 aesthetic

## Cost Estimation

Refer to https://fal.ai/pricing for current rates.
Typical costs:
- Image generation: ~$0.02-0.05 per image
- Video generation: ~$0.20-0.50 per 10s video

For 40 cards (~25 images + 2 videos), estimate ~$2-3 total.

## Sources

- [Wan 2.6 Developer Guide (fal.ai)](https://fal.ai/learn/devs/wan-26-developer-guide-mastering-next-generation-video-generation)
- [fal.ai API Documentation](https://fal.ai/models/wan-video/wan-2-6-i2v)
- [Wan 2.6 on Novita.ai](https://novita.ai/docs/api-reference/model-apis-wan2.6-i2v)
- [Wan 2.6 Pricing (PiAPI)](https://piapi.ai/wan/wan-2-6)
