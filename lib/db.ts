import { eq, and, inArray, desc } from 'drizzle-orm';
import { getDb } from './drizzle';
import { answers, likes } from './schema';

export interface Answer {
  id: number;
  questionIndex: number;
  authorName: string;
  text: string;
  likedBy: string[];
  createdAt: number;
}

export async function getAnswers(questionIndex: number): Promise<Answer[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(answers)
    .where(eq(answers.questionIndex, questionIndex))
    .orderBy(desc(answers.createdAt));

  if (rows.length === 0) return [];

  const likeRows = await db
    .select()
    .from(likes)
    .where(inArray(likes.answerId, rows.map(r => r.id)));

  return rows.map(r => ({
    ...r,
    likedBy: likeRows.filter(l => l.answerId === r.id).map(l => l.clientId),
  }));
}

export async function addAnswer(questionIndex: number, authorName: string, text: string): Promise<Answer> {
  const db = getDb();
  const [row] = await db
    .insert(answers)
    .values({ questionIndex, authorName, text, createdAt: Date.now() })
    .returning();
  return { ...row, likedBy: [] };
}

export async function toggleLike(id: number, clientId: string): Promise<{ likeCount: number; likedBy: string[] } | null> {
  const db = getDb();
  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.answerId, id), eq(likes.clientId, clientId)));

  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.answerId, id), eq(likes.clientId, clientId)));
  } else {
    await db.insert(likes).values({ answerId: id, clientId });
  }

  const allLikes = await db.select().from(likes).where(eq(likes.answerId, id));
  return {
    likeCount: allLikes.length,
    likedBy: allLikes.map(l => l.clientId),
  };
}
