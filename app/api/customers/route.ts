import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createCustomer, getCustomers } from '@/lib/db';

export async function GET() {
  const customers = getCustomers();
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name || '').trim();
  const address = (body.address || '').trim();

  if (!name || !address) {
    return NextResponse.json(
      { error: 'Both name and address are required.' },
      { status: 400 }
    );
  }

  const customer = {
    id: uuidv4(),
    name,
    address,
    created_at: new Date().toISOString(),
  };

  createCustomer(customer);

  return NextResponse.json({ customer }, { status: 201 });
}
