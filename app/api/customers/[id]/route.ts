import { NextRequest, NextResponse } from 'next/server';
import { getCustomer, getMockupsForCustomer } from '@/lib/db';

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
