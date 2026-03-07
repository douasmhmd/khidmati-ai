const API = "http://localhost:8000";

export async function sendChat(text: string, lang: string, sessionId: string) {
  const res = await fetch(`${API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang, session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Chat API error");
  return res.json() as Promise<{ response: string }>;
}

export async function resetChat(sessionId: string, lang: string) {
  await fetch(`${API}/api/chat/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, lang }),
  }).catch(() => {});
}

export async function playTTS(text: string, lang: string): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch(`${API}/audio/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    return audio;
  } catch {
    return null;
  }
}

export async function scanCIN(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API}/api/document/scan-cin`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Scan CIN error");
  return res.json();
}

export async function transcribeAudio(blob: Blob, lang: string) {
  const formData = new FormData();
  formData.append("file", blob, "voice.webm");
  const res = await fetch(`${API}/api/audio/process?lang=${lang}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("STT error");
  return res.json() as Promise<{ transcription: string }>;
}

export async function submitWatiqati(data: Record<string, string | null>) {
  const res = await fetch(`${API}/api/watiqati/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Submit error");
  return res.json();
}
