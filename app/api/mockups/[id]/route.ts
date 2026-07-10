import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getMockup, deleteMockup } from '@/lib/db';

async function removeIfExists(publicPath: string | null) {
  if (!publicPath) return;
  const fullPath = path.join(process.cwd(), 'public', publicPath);
  await fs.rm(fullPath, { force: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const mockup = getMockup(params.id);
  if (!mockup) {
    return NextResponse.json({ error: 'Mockup not found.' }, { status: 404 });
  }

  deleteMockup(params.id);

  // Clean up its saved files too, not just the database row.
  await removeIfExists(mockup.house_image_path);
  await removeIfExists(mockup.reference_image_path);
  await removeIfExists(mockup.mockup_image_path);

  return NextResponse.json({ success: true });
}
