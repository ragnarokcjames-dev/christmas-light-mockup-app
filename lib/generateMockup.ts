import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

// ---------------------------------------------------------------------------
// WHAT THIS FILE DOES
// ---------------------------------------------------------------------------
// Takes a real photo of a house + (optionally) a reference photo showing the
// lighting style the client wants, and asks OpenAI's image model (gpt-image-1)
// to edit the house photo so it looks like it has that Christmas light style
// installed on it.
//
// gpt-image-1's edit endpoint accepts MULTIPLE input images. We pass:
//   1. The house photo  -> "this is the real structure, keep it accurate"
//   2. The reference photo -> "match this lighting style"
// plus a text prompt describing exactly what a lighting installer means by
// "warm white roofline lights + a lit wreath", so the model doesn't just
// paint random colored bulbs everywhere.
//
// DEMO MODE: if no OPENAI_API_KEY is set, we skip the real API call and
// return the original house photo untouched, so the rest of the app (saving,
// organizing, viewing mockups per customer) can still be demoed end to end.
// This mirrors how James handled the Runway integration in the Lumora
// project — write the real integration, but don't let a missing key block
// the whole demo.
// ---------------------------------------------------------------------------

const DEMO_MODE = !process.env.OPENAI_API_KEY;

const openai = DEMO_MODE
  ? null
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(notes?: string) {
  const base = `You are editing a real estate / home exterior photograph for a
professional Christmas light installation company. Add warm white LED string
lights closely following the actual roofline, gables, and porch trim of the
house in the FIRST image. Use the SECOND image only as a style reference for
how thick, warm, and evenly-spaced the light strands should look — do not
copy its house shape or background.

Rules:
- Keep the house structure, windows, doors, siding, and landscaping exactly
  as they are in the first image. Do not change the architecture.
- Lights should look physically installed: following real edges, not
  floating or overlapping windows.
- Use warm white (2700K) tone unless the notes below say otherwise.
- It should be nighttime or dusk in the final image, with the lights clearly
  glowing.
- Photorealistic result, not a cartoon or illustration.`;

  if (notes && notes.trim().length > 0) {
    return `${base}\n\nAdditional instructions from the installer: ${notes.trim()}`;
  }
  return base;
}

export async function generateMockup(
  houseImageBuffer: Buffer,
  houseMimeType: string,
  referenceImageBuffer: Buffer | null,
  referenceMimeType: string | null,
  notes?: string
): Promise<Buffer> {
  if (DEMO_MODE || !openai) {
    // No API key configured — return the original house photo so the app
    // still functions end-to-end for a demo/review.
    return houseImageBuffer;
  }

  const prompt = buildPrompt(notes);

  const houseFile = await toFile(houseImageBuffer, 'house.png', {
    type: houseMimeType,
  });

  const images = [houseFile];

  if (referenceImageBuffer && referenceMimeType) {
    const referenceFile = await toFile(referenceImageBuffer, 'reference.png', {
      type: referenceMimeType,
    });
    images.push(referenceFile);
  }

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: images,
    prompt,
    size: '1024x1536',
    quality: 'high',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('AI provider did not return an image');
  }

  return Buffer.from(b64, 'base64');
}

export { DEMO_MODE };
