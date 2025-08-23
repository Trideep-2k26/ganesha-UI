export type HistoryItem = { role: 'user' | 'assistant'; content: string };

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function chatAPI(params: {
  text: string;
  language?: string;
  history?: HistoryItem[];
  context?: Record<string, any>;
  temperature?: number;
}) {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: params.text,
      language: params.language,
      temperature: params.temperature ?? 0.6,
      context: params.context,
      history: params.history,
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Chat request failed');
    throw new Error(msg);
  }
  return (await res.json()) as {
    text: string;
    language: string;
    safety_flags: string[];
    meta: Record<string, any>;
  };
}

export async function ttsAPI(params: {
  text: string;
  language?: string;
  voice?: string;
  rate?: number;
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/tts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: params.text,
      language: params.language,
      voice: params.voice,
      rate: params.rate,
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'TTS request failed');
    throw new Error(msg);
  }
  return await res.blob();
}

export function playAudioBlob(blob: Blob, opts?: { volume?: number; onEnded?: () => void }) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  if (typeof opts?.volume === 'number') {
    audio.volume = Math.min(1, Math.max(0, opts.volume));
  }
  audio.onended = () => {
    URL.revokeObjectURL(url);
    opts?.onEnded && opts.onEnded();
  };
  audio.play().catch(() => URL.revokeObjectURL(url));
  return audio; // return element so caller can stop/replace if needed
}
