import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { createMockup, getCustomer } from '@/lib/db';
import { generateMockup, DEMO_MODE } from '@/lib/generateMockup';

async function saveFile(
  buffer: Buffer,
  customerId: string,
  filename: string
): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads', customerId);
  await fs.mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);
  // Path relative to /public so it can be used directly as an <img src>
  return `/uploads/${customerId}/${filename}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const customerId = formData.get('customerId') as string | null;
  const notes = (formData.get('notes') as string | null) || '';
  const houseFile = formData.get('housePhoto') as File | null;
  const referenceFile = formData.get('referenceImage') as File | null;

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId.' }, { status: 400 });
  }
  if (!houseFile) {
    return NextResponse.json(
      { error: 'A house photo is required.' },
      { status: 400 }
    );
  }

  const customer = getCustomer(customerId);
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  const houseBuffer = Buffer.from(await houseFile.arrayBuffer());
  const referenceBuffer = referenceFile
    ? Buffer.from(await referenceFile.arrayBuffer())
    : null;

  const mockupId = uuidv4();
  const timestamp = Date.now();

  // Save the originals so they stay attached to the customer's record too.
  const houseSavedPath = await saveFile(
    houseBuffer,
    customerId,
    `house-${timestamp}${extFromType(houseFile.type)}`
  );
  const referenceSavedPath = referenceFile
    ? await saveFile(
        referenceBuffer as Buffer,
        customerId,
        `reference-${timestamp}${extFromType(referenceFile.type)}`
      )
    : null;

  let mockupBuffer: Buffer;
  try {
    mockupBuffer = await generateMockup(
      houseBuffer,
      houseFile.type || 'image/png',
      referenceBuffer,
      referenceFile?.type || null,
      notes
    );
  } catch (err) {
    console.error('AI generation failed:', err);
    return NextResponse.json(
      { error: 'AI mockup generation failed. Check server logs / API key.' },
      { status: 502 }
    );
  }

  const mockupSavedPath = await saveFile(
    mockupBuffer,
    customerId,
    `mockup-${timestamp}.png`
  );

  const mockup = {
    id: mockupId,
    customer_id: customerId,
    house_image_path: houseSavedPath,
    reference_image_path: referenceSavedPath,
    mockup_image_path: mockupSavedPath,
    notes,
    created_at: new Date().toISOString(),
  };

  createMockup(mockup);

  return NextResponse.json({ mockup, demoMode: DEMO_MODE }, { status: 201 });
}

function extFromType(mimeType: string): string {
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('webp')) return '.webp';
  return '.jpg';
}
