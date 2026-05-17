import { NextResponse } from 'next/server';
import { QUESTIONS, getCurrentIndex, getTimeUntilNextMs } from '@/lib/questions';
import { getAnswers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const index = getCurrentIndex();
  try {
    const answers = await getAnswers(index);
    return NextResponse.json({
      question: QUESTIONS[index],
      questionIndex: index,
      answers,
      timeUntilNextMs: getTimeUntilNextMs(),
    });
  } catch (e) {
    console.error('DB error:', e);
    return NextResponse.json({
      question: QUESTIONS[index],
      questionIndex: index,
      answers: [],
      timeUntilNextMs: getTimeUntilNextMs(),
      error: 'DB connection failed',
    });
  }
}
