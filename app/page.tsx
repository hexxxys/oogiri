'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Answer } from '@/lib/db';

function useClientId(): string {
  const [clientId, setClientId] = useState('');
  useEffect(() => {
    let id = localStorage.getItem('oogiri-client-id');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('oogiri-client-id', id);
    }
    setClientId(id);
  }, []);
  return clientId;
}

function useCountdown(initialMs: number) {
  const [ms, setMs] = useState(initialMs);
  useEffect(() => {
    setMs(initialMs);
    const t = setInterval(() => setMs(prev => Math.max(0, prev - 1000)), 1000);
    return () => clearInterval(t);
  }, [initialMs]);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'たった今';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
  return `${Math.floor(diff / 86400000)}日前`;
}

export default function HomePage() {
  const clientId = useClientId();
  const [question, setQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeUntilNextMs, setTimeUntilNextMs] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [liking, setLiking] = useState<Set<number>>(new Set());
  const prevIndexRef = useRef(-1);
  const countdown = useCountdown(timeUntilNextMs);

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch('/api/current');
      const data = await res.json();
      if (data.questionIndex !== prevIndexRef.current) {
        prevIndexRef.current = data.questionIndex;
        setQuestion(data.question);
        setQuestionIndex(data.questionIndex);
        setTimeUntilNextMs(data.timeUntilNextMs);
      }
      setAnswers(Array.isArray(data.answers) ? data.answers : []);
    } catch {
      // network error, ignore
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('oogiri-name') ?? '';
    setAuthorName(saved);
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 5000);
    return () => clearInterval(interval);
  }, [fetchCurrent]);

  async function handlePost() {
    if (!authorName.trim() || !text.trim()) { setPostError('名前と回答を入力してください'); return; }
    setPosting(true); setPostError('');
    localStorage.setItem('oogiri-name', authorName);

    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, text }),
    });
    if (res.ok) {
      setText('');
      await fetchCurrent();
    } else {
      const d = await res.json();
      setPostError(d.error ?? 'エラーが発生しました');
    }
    setPosting(false);
  }

  async function handleLike(answerId: number) {
    if (!clientId || liking.has(answerId)) return;
    setLiking(s => new Set([...s, answerId]));

    const res = await fetch(`/api/like/${answerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    if (res.ok) {
      const { likedBy } = await res.json();
      setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, likedBy } : a));
    }
    setLiking(s => { const n = new Set(s); n.delete(answerId); return n; });
  }

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ec' }}>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: '#e85d04' }}>大喜利</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">次のお題まで</span>
            <span className="font-mono font-bold text-gray-600 tabular-nums text-sm">{countdown}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* お題 */}
        <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #e85d04, #f4a261)' }}>
          <p className="text-xs font-medium opacity-75 mb-2 tracking-wide">今のお題</p>
          <p className="text-xl font-bold leading-relaxed">{question || '読み込み中...'}</p>
        </div>

        {/* 投稿フォーム */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-700">あなたの回答を投稿</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="名前"
              maxLength={20}
              className="w-28 shrink-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
              placeholder="面白い回答を入力..."
              maxLength={150}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          {postError && <p className="text-red-500 text-xs">{postError}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">{text.length}/150</span>
            <button
              onClick={handlePost}
              disabled={posting || !text.trim() || !authorName.trim()}
              className="px-5 py-2 text-sm text-white font-bold rounded-xl disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: '#e85d04' }}
            >
              {posting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>

        {/* 回答フィード */}
        <div>
          <p className="text-xs text-gray-400 mb-3 font-medium">{answers.length}件の回答</p>
          <div className="space-y-3">
            {answers.map(answer => {
              const liked = clientId ? answer.likedBy.includes(clientId) : false;
              return (
                <div key={answer.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-gray-800">{answer.authorName}</span>
                        <span className="text-xs text-gray-300">{timeAgo(answer.createdAt)}</span>
                      </div>
                      <p className="text-base text-gray-700 leading-relaxed">{answer.text}</p>
                    </div>
                    <button
                      onClick={() => handleLike(answer.id)}
                      disabled={liking.has(answer.id)}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        liked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400'
                      }`}
                    >
                      <span>{liked ? '❤️' : '🤍'}</span>
                      <span className="tabular-nums">{answer.likedBy.length}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {answers.length === 0 && question && (
              <div className="text-center py-12 text-gray-300">
                <p className="text-4xl mb-3">🎭</p>
                <p className="text-sm">まだ回答がありません。最初に投稿しよう！</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
