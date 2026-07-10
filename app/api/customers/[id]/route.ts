import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import {
  getCustomer,
  getMockupsForCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = getCustomer(params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  const mockups = getMockupsForCustomer(params.id);

  return NextResponse.json({ customer, mockups });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = getCustomer(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  const body = await req.json();
  const name = (body.name || '').trim();
  const address = (body.address || '').trim();

  if (!name || !address) {
    return NextResponse.json(
      { error: 'Both name and address are required.' },
      { status: 400 }
    );
  }

  updateCustomer(params.id, { name, address });

  const customer = getCustomer(params.id);
  return NextResponse.json({ customer });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = getCustomer(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  // Removes their DB rows (customer + all their mockups) and their saved
  // photos on disk, so deleting a customer actually cleans everything up.
  deleteCustomer(params.id);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', params.id);
  await fs.rm(uploadsDir, { recursive: true, force: true });

  return NextResponse.json({ success: true });
}
