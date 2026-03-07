const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Envoie un message au chatbot et retourne la réponse.
 */
export const sendMessage = async (message, language, sessionId) => {
  try {
    const response = await fetch(`${API_URL}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        session_id: sessionId,
        user_profile: { accessibility: true },
      }),
    });
    return await response.json();
  } catch (error) {
    return { error: 'ماكاينش الانترنيت، حاول من جديد' };
  }
};

/**
 * Transcrit un enregistrement audio en texte.
 */
export const transcribeAudio = async (audioBlob, language = 'auto') => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);
    const response = await fetch(`${API_URL}/audio/transcribe`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  } catch (error) {
    return { error: 'مشكل في التسجيل' };
  }
};

/**
 * Envoie une image de document pour extraction OCR.
 */
export const uploadDocument = async (imageFile, hint = 'auto') => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('document_hint', hint);
    const response = await fetch(`${API_URL}/document/`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  } catch (error) {
    return { error: 'مشكل في الصورة' };
  }
};

/**
 * Retourne la liste de toutes les démarches disponibles.
 */
export const getDemarches = async () => {
  try {
    const response = await fetch(`${API_URL}/demarches/`);
    return await response.json();
  } catch (error) {
    return { error: 'مشكل في التحميل' };
  }
};
