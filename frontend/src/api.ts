export const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${clean}`;
}

export async function apiHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function apiTemplates() {
  const res = await fetch(`${API_BASE}/api/templates`);
  return res.json();
}

export async function apiVqa(image: File, question: string, engine: string = 'blip') {
  const fd = new FormData();
  fd.append('image', image);
  fd.append('question', question);
  fd.append('engine', engine);
  const res = await fetch(`${API_BASE}/api/vqa`, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'VQA request failed');
  }
  return res.json();
}

export async function apiExpand(question: string, shortAnswer: string, technique: string = 'both') {
  const res = await fetch(`${API_BASE}/api/expand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, short_answer: shortAnswer, technique }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Expand failed');
  }
  return res.json();
}

export async function apiGenerate(prompt: string, provider?: string) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Generate failed');
  }
  return res.json();
}

export async function apiPresets() {
  const res = await fetch(`${API_BASE}/api/presets`);
  return res.json();
}

export async function apiEvalPairs() {
  const res = await fetch(`${API_BASE}/api/eval/pairs`);
  return res.json();
}

export async function apiEvalRun(engine: string = 'blip', threshold: number = 0.8) {
  const res = await fetch(`${API_BASE}/api/eval/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine, threshold }),
  });
  return res.json();
}

export async function apiEvalResults() {
  const res = await fetch(`${API_BASE}/api/eval/results`);
  if (!res.ok) return null;
  return res.json();
}

export async function apiEvalOverride(id: string, verdict: boolean, failureReason?: string, notes?: string) {
  const res = await fetch(`${API_BASE}/api/eval/results`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, verdict, failure_reason: failureReason, notes }),
  });
  return res.json();
}

export async function apiUnanswerableRun(engine: string = 'blip') {
  const res = await fetch(`${API_BASE}/api/eval/unanswerable/run?engine=${engine}`, { method: 'POST' });
  return res.json();
}
