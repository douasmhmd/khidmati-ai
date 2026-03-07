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
  text: 'مرحبا! أنا خدمتي 🤖\nBienvenue ! Je suis Khidmati AI.\nواش خاصك تجدد البطاقة، شهادة الميلاد، راميد، أو تصحيح الإمضاء؟',
  timestamp: new Date(),
};

function ChatInterface() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [language, setLanguage] = useState('darija');
  const [fontSize, setFontSize] = useState(18);
  const [highContrast, setHighContrast] = useState(false);
  const [checklist, setChecklist] = useState(null);

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

  const bgClass = highContrast ? 'bg-black text-white' : 'bg-gray-100';
  const bubbleAssistant = highContrast
    ? 'bg-gray-800 text-white'
    : 'bg-white text-gray-800';
  const bubbleUser = highContrast
    ? 'bg-green-900 text-white'
    : 'bg-green-100 text-gray-800';

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
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' ? bubbleUser : bubbleAssistant
              }`}
              dir={language === 'fr' ? 'ltr' : 'rtl'}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speak(msg.text)}
                  className="mt-1 text-xs opacity-60 hover:opacity-100"
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
            <div className={`rounded-2xl px-4 py-3 shadow-sm ${bubbleAssistant}`}>
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div
        className={`px-3 py-3 border-t ${
          highContrast ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
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
            className={`flex-1 rounded-full px-4 py-3 border outline-none text-base min-w-0 ${
              highContrast
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
            style={{ fontSize }}
          />

          {/* Bouton envoi */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-40"
            style={{ backgroundColor: '#0A6E5C', minWidth: 48 }}
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
