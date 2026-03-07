const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Envoie un message avec l'historique complet au chatbot.
 * payload: { text, history: [{role, content}], lang, session_id }
 */
export const sendMessage = async (text, history, lang, sessionId) => {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, history, lang, session_id: sessionId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.detail || 'Erreur API');
    return data;
  } catch (error) {
    return { error: 'ماكاينش الانترنيت أو البيرون ما خدامش. حاول من جديد.' };
  }
};

/**
 * Transcrit un enregistrement audio (webm/ogg).
 * lang: 'darija' (Whisper) | 'amazigh' (Odyssey)
 */
export const transcribeAudio = async (audioBlob, lang = 'darija') => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice.webm');
    const response = await fetch(`${API_BASE}/api/audio/process?lang=${lang}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.detail || 'Erreur audio');
    return data;
  } catch (error) {
    return { error: 'مشكل في معالجة التسجيل' };
  }
};

/**
 * Scanne une image de CIN et extrait nom, prenom, cin.
 */
export const scanCin = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await fetch(`${API_BASE}/api/document/scan-cin`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.detail || 'Erreur scan');
    return data;
  } catch (error) {
    return { error: 'مشكل في تحليل الوثيقة' };
  }
};

/**
 * Retourne la liste de toutes les démarches disponibles.
 */
export const getDemarches = async () => {
  try {
    const response = await fetch(`${API_BASE}/demarches/`);
    return await response.json();
  } catch (error) {
    return { error: 'مشكل في التحميل' };
  }
};
