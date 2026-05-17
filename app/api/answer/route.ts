import { NextRequest, NextResponse } from 'next/server';
import { addAnswer } from '@/lib/db';
import { getCurrentIndex } from '@/lib/questions';

export async function POST(req: NextRequest) {
  const { authorName, text } = await req.json();
  if (!authorName?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'Name and text required' }, { status: 400 });
  }
  if (text.trim().length > 150) {
    return NextResponse.json({ error: 'Too long' }, { status: 400 });
  }

  const answer = await addAnswer(getCurrentIndex(), authorName, text);
  return NextResponse.json(answer);
}
