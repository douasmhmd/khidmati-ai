import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/api';
import AccessibilityBar from './AccessibilityBar';
import AudioRecorder from './AudioRecorder';
import DocumentUpload from './DocumentUpload';
import ChecklistView from './ChecklistView';

// Message de bienvenue initial
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'ⴰⵣⵓⵍ! ⵏⴽⴽ ⴷ ⵅⴷⵎⵜⵉ ★\nمرحبا! أنا خدمتي AI\nBienvenue ! Je suis Khidmati AI.\nواش خاصك تجدد البطاقة، شهادة الميلاد، راميد، أو تصحيح الإمضاء؟',
  timestamp: new Date(),
};

function ChatInterface() {
  const [messages, setMessages]     = useState([WELCOME_MESSAGE]);
  const [inputText, setInputText]   = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [sessionId]                 = useState(() => `session_${Date.now()}`);
  const [language, setLanguage]     = useState('darija');
  const [fontSize, setFontSize]     = useState(18);
  const [highContrast, setHighContrast] = useState(false);
  const [checklist, setChecklist]   = useState(null);

  const messagesEndRef = useRef(null);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Appliquer la taille de police globale
  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
  }, [fontSize]);

  const handleSend = async (text) => {
    const trimmed = (text || inputText).trim();
    if (!trimmed) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const result = await sendMessage(trimmed, language, sessionId);
    setIsLoading(false);

    if (result.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: result.error,
          timestamp: new Date(),
          isError: true,
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        text: result.response,
        timestamp: new Date(),
      },
    ]);

    if (result.checklist) {
      setChecklist(result.checklist);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Lecture vocale via Web Speech API
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === 'fr' ? 'fr-FR' : language === 'arabic' ? 'ar-SA' : 'ar-MA';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  /* ── Styles based on contrast mode ── */
  const bgClass = highContrast
    ? 'bg-black text-white high-contrast'
    : 'bg-amazigh-pattern text-gray-800';

  const bubbleAssistantStyle = highContrast
    ? { backgroundColor: '#1a1a1a', color: '#fff', borderLeft: '4px solid #C8A951' }
    : { backgroundColor: '#FDF8EE', color: '#1a1a1a', borderLeft: '4px solid #006233', boxShadow: '0 2px 8px rgba(0,98,51,0.1)' };

  const bubbleUserStyle = highContrast
    ? { backgroundColor: '#004D2B', color: '#fff' }
    : { backgroundColor: '#006233', color: '#fff', boxShadow: '0 2px 8px rgba(0,98,51,0.25)' };

  const inputBarStyle = highContrast
    ? { backgroundColor: '#111', borderTop: '1px solid #333' }
    : { backgroundColor: '#fff', borderTop: '2px solid #C8A951' };

  const inputStyle = highContrast
    ? { backgroundColor: '#222', border: '1px solid #555', color: '#fff' }
    : { backgroundColor: '#f9f5eb', border: '1px solid #C8A951', color: '#1a1a1a', transition: 'box-shadow 0.2s, border-color 0.2s' };

  return (
    <div className={`flex flex-col h-screen ${bgClass}`} style={{ fontSize }}>
      {/* Barre d'accessibilité */}
      <AccessibilityBar
        fontSize={fontSize}
        setFontSize={setFontSize}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-slide-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant icon */}
            {msg.role === 'assistant' && (
              <span
                className="self-end mb-1 mr-1 text-lg select-none"
                style={{ color: '#C8A951', minWidth: 24, textAlign: 'center' }}
                aria-hidden="true"
              >
                ★
              </span>
            )}

            <div
              className="max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3"
              style={msg.role === 'user' ? bubbleUserStyle : bubbleAssistantStyle}
              dir={language === 'fr' ? 'ltr' : 'rtl'}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speak(msg.text)}
                  className="mt-1 text-xs transition-opacity duration-200"
                  style={{ opacity: 0.6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  aria-label="Lire le message"
                  title="Lire"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="flex justify-start">
            <span className="self-end mb-1 mr-1 text-lg" style={{ color: '#C8A951', minWidth: 24, textAlign: 'center' }} aria-hidden="true">★</span>
            <div className="rounded-2xl px-4 py-3" style={bubbleAssistantStyle}>
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#006233', animationDelay: '0ms'   }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#006233', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#006233', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Checklist si disponible */}
      {checklist && (
        <div className="px-3 pb-2">
          <ChecklistView
            checklist={checklist}
            highContrast={highContrast}
            onClose={() => setChecklist(null)}
          />
        </div>
      )}

      {/* Barre de saisie */}
      <div className="px-3 py-3" style={inputBarStyle}>
        <div className="flex items-center gap-2">
          {/* Upload document */}
          <DocumentUpload
            onExtracted={(data) => {
              const docInfo = data.extracted_data
                ? `📄 وثيقة: ${data.document_type}\n${Object.entries(data.extracted_data)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n')}`
                : 'تم رفع الوثيقة ✅';
              setMessages((prev) => [
                ...prev,
                {
                  id: `doc_${Date.now()}`,
                  role: 'assistant',
                  text: docInfo,
                  timestamp: new Date(),
                },
              ]);
            }}
          />

          {/* Champ texte */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'fr' ? 'Écrivez votre message…' : 'كتب هنا…'}
            dir={language === 'fr' ? 'ltr' : 'rtl'}
            className="flex-1 rounded-full px-4 py-3 text-base min-w-0 input-moroccan"
            style={{ ...inputStyle, fontSize }}
          />

          {/* Bouton envoi */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all duration-200"
            style={{ backgroundColor: '#006233', minWidth: 48, boxShadow: '0 2px 8px rgba(0,98,51,0.35)' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#004D2B')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#006233')}
            aria-label="Envoyer"
          >
            ➤
          </button>

          {/* Enregistreur audio */}
          <AudioRecorder
            onTranscription={(text) => handleSend(text)}
            language={language}
            fontSize={fontSize}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
