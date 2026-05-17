import { pgTable, serial, integer, text, bigint, primaryKey } from 'drizzle-orm/pg-core';

export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  questionIndex: integer('question_index').notNull(),
  authorName: text('author_name').notNull(),
  text: text('text').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const likes = pgTable('likes', {
  answerId: integer('answer_id').notNull(),
  clientId: text('client_id').notNull(),
}, t => [primaryKey({ columns: [t.answerId, t.clientId] })]);
