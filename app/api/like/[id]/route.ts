import { NextRequest, NextResponse } from 'next/server';
import { toggleLike } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clientId } = await req.json();
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const result = await toggleLike(Number(id), clientId);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(result);
}
