import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Camera, FileText, Languages, Loader2, Mic, Plus, Send, Square, User, Volume2, CreditCard, Plane, Shield, Home, ArrowRight, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const makeId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Translations
const TRANSLATIONS = {
  darija: {
    welcome: 'مرحبا بك فخدمتي. أنا الوكيل الإداري ديالك. قولي ليا شنو بغيتي ندير ليك اليوم؟',
    selectService: 'اختر الخدمة',
    orChat: 'أو تحدث مع الوكيل مباشرة',
    chatButton: 'محادثة مع الوكيل',
    confirmedData: 'بيانات مؤكدة',
    captureTitle: 'التقط صورة البطاقة الوطنية',
    placeCard: 'ضع البطاقة هنا',
    takePhoto: 'التقط الصورة',
    dataExtracted: 'تم استخراج البيانات!',
    confirmData: 'تأكيد البيانات',
    retakePhoto: 'إعادة التصوير',
    backToServices: 'رجوع للخدمات',
    confirmInfo: 'تأكد من المعلومات',
    readInfo: 'اقرأ المعلومات',
    fullName: 'الاسم الكامل',
    idNumber: 'رقم البطاقة',
    surname: 'النسب',
    confirmRequest: 'تأكيد الطلب',
    back: 'رجوع',
    success: 'تم بنجاح!',
    processing: 'طلبك قيد المعالجة',
    trackingNumber: 'رقم المتابعة',
    backToStart: 'الرجوع للبداية',
    listening: 'جاري الاستماع...',
    processingAudio: 'يعالج الصوت...',
    analyzing: 'يحلل الوثيقة...',
    thinking: 'الوكيل يفكر...',
    stop: 'إيقاف',
    listen: 'استماع',
    newChat: 'جديد',
    document: 'وثيقة',
    cinDataReceived: 'تم استلام بيانات البطاقة الوطنية:',
    cinWelcome: 'مرحبا! هادو هما البيانات اللي لقيت من البطاقة الوطنية ديالك:',
    cinConfirm: 'واش هاد المعلومات صحيحة؟',
    whatNext: 'شنو بغيتي دير دابا؟',
  },
  amazigh: {
    welcome: 'ⴰⵣⵓⵍ! ⵏⴽⴽⵉ ⴷ Khidmati. ⵎⴰⵏⵉⴽ ⵜⵙⵙⵏⵖ ⴰⴷ ⴰⵡⵏⴽ ⵄⴰⵡⵏⵖ?',
    selectService: 'ⴽⵛⵎ ⵖⵔ ⵓⵎⵙⴰⵙⴰ',
    orChat: 'ⵏⵖ ⵙⴰⵡⴰⵍ ⴰⴽ ⵓⵎⵙⴰⵙⴰ',
    chatButton: 'ⴰⵎⵙⴰⵙⴰ',
    confirmedData: 'ⵉⵙⴼⴽⴰ ⵉⵎⵣⵡⵓⵔⴰ',
    captureTitle: 'ⵟⵟⴼ ⵜⴰⵎⵍⴰⵢⵜ ⵏ ⵜⴱⴰⵟⵏⴰ',
    placeCard: 'ⵔⵣⵓ ⵜⴰⴱⴰⵟⵏⴰ ⴷⴰ',
    takePhoto: 'ⵟⵟⴼ ⵜⴰⵎⵍⴰⵢⵜ',
    dataExtracted: 'ⵉⴼⴽⴰ-ⴷ ⵉⵙⴼⴽⴰ!',
    confirmData: 'ⵙⵙⵏⵜⵉ ⵉⵙⴼⴽⴰ',
    retakePhoto: 'ⵄⴰⵡⴷ ⵟⵟⴼ',
    backToServices: 'ⵄⵓⴷ ⵖⵔ ⵓⵎⵙⴰⵙⴰ',
    confirmInfo: 'ⵙⵙⵏⵜⵉ ⵜⴰⵙⵎⵓⵏⵉ',
    readInfo: 'ⵖⵔ ⵜⴰⵙⵎⵓⵏⵉ',
    fullName: 'ⵉⵙⵎ ⵓⵎⵎⵉⴷ',
    idNumber: 'ⵓⵟⵟⵓ ⵏ ⵜⴱⴰⵟⵏⴰ',
    surname: 'ⵉⵙⵎ ⵏ ⵓⵡⴰⵍ',
    confirmRequest: 'ⵙⵙⵏⵜⵉ ⵜⴰⵙⵓⵜⵍⵜ',
    back: 'ⵄⵓⴷ',
    success: 'ⵉⵄⵊⴱ!',
    processing: 'ⵜⴰⵙⵓⵜⵍⵜ ⵏⵏⴽ ⵜⵙⵙⵔⵓⵙⵓ',
    trackingNumber: 'ⵓⵟⵟⵓ ⵏ ⵜⴰⵙⵓⵜⵍⵜ',
    backToStart: 'ⵄⵓⴷ ⵖⵔ ⵜⴰⵣⵡⴰⵔⵜ',
    listening: 'ⵢⵙⵙⵍⴼⴰⴷ...',
    processingAudio: 'ⵢⵙⵙⵔⵓⵙⵓ ⵜⴰⵎⵍⴰⵢⵜ...',
    analyzing: 'ⵢⵙⵙⵎⵓⵏ ⵜⴰⵡⵍⴰⴼⵜ...',
    thinking: 'ⵓⵎⵙⴰⵙⴰ ⵢⵙⵙⵔⴰ...',
    stop: 'ⵄⴱⴱ',
    listen: 'ⵙⵍⴰ',
    newChat: 'ⴰⵎⵙⴰⵙⴰ ⴰⵎⴰⵢⵏⵓ',
    document: 'ⵜⴰⵡⵍⴰⴼⵜ',
    cinDataReceived: 'ⵍⵍⴰⵏ ⵉⵙⴼⴽⴰ ⵏ ⵜⴱⴰⵟⵏⴰ:',
    cinWelcome: 'ⴰⵣⵓⵍ! ⵉⵎⵎⵉⴷ ⵉⵙⴼⴽⴰ ⵏ ⵜⴱⴰⵟⵏⴰ ⵏⵏⴽ:',
    cinConfirm: 'ⵎⴰⵛⴰ ⵜⵉⴷⵜ ⵉⵙⴼⴽⴰ ⴰ?',
    whatNext: 'ⵎⴰⵏⵉⴽ ⵜⵙⵙⵏⵖ ⴰⴷ ⵉⵔⵓⵏ?',
  },
};

const INITIAL_MESSAGE = {
  id: makeId(),
  role: 'assistant',
  type: 'text',
  content: TRANSLATIONS.darija.welcome,
};

const SERVICES = [
  { id: 'birth',     icon: FileText,   color: 'bg-blue-500',   label: { darija: 'شهادة الميلاد', amazigh: 'ⵜⴰⵔⵔⴰⵢⵜ ⵏ ⵜⵍⴰⵍⵉⵜ' }, emoji: '👶' },
  { id: 'id',        icon: CreditCard, color: 'bg-green-500',  label: { darija: 'البطاقة الوطنية', amazigh: 'ⵜⴰⴱⴰⵟⵏⴰ ⵜⴰⵏⴰⵎⵓⵔⵜ' }, emoji: '🪪' },
  { id: 'passport',  icon: Plane,      color: 'bg-purple-500', label: { darija: 'جواز السفر', amazigh: 'ⵜⴰⴱⵓⵔⵜ ⵏ ⵓⴼⵔⵔ' }, emoji: '✈️' },
  { id: 'criminal',  icon: Shield,     color: 'bg-orange-500', label: { darija: 'السجل العدلي', amazigh: 'ⴰⵎⵣⵔⵓⵢ ⵏ ⵜⵎⵙⵙⵓⵔⵜ' }, emoji: '📋' },
  { id: 'residence', icon: Home,       color: 'bg-red-500',    label: { darija: 'شهادة السكنى', amazigh: 'ⵜⴰⵔⵔⴰⵢⵜ ⵏ ⵓⵣⴷⴰⵖ' }, emoji: '🏠' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('services'); // 'services' | 'chat' | 'capture' | 'confirm'
  const [selectedService, setSelectedService] = useState(null);

  const [messages, setMessages] = useState(() => {
    const cached = localStorage.getItem('khidmati_messages_v1');
    if (!cached) return [INITIAL_MESSAGE];
    try {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [languageMode, setLanguageMode] = useState('darija');
  const [validatedCitizen, setValidatedCitizen] = useState(() => {
    const cached = localStorage.getItem('khidmati_validated_citizen_v1');
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  });
  const [extractedData, setExtractedData] = useState(null);

  const chatEndRef = useRef(null);
  const lastSpokenMessageIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const sessionIdRef = useRef(`session_${Date.now()}`);
  const currentAudioRef = useRef(null);

  const isAmazigh = languageMode === 'amazigh';
  const t = isAmazigh ? TRANSLATIONS.amazigh : TRANSLATIONS.darija;

  const appFontFamily = useMemo(() => {
    if (isAmazigh) {
      return '"Noto Sans Tifinagh", "Noto Kufi Arabic", "Segoe UI", Tahoma, sans-serif';
    }
    return '"Noto Kufi Arabic", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif';
  }, [isAmazigh]);

  useEffect(() => {
    localStorage.setItem('khidmati_messages_v1', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.documentElement.lang = isAmazigh ? 'tzm' : 'ar';
    document.documentElement.dir = 'rtl';
  }, [isAmazigh]);

  useEffect(() => {
    if (validatedCitizen) {
      localStorage.setItem('khidmati_validated_citizen_v1', JSON.stringify(validatedCitizen));
    }
  }, [validatedCitizen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || lastMessage.type !== 'text') return;
    if (lastSpokenMessageIdRef.current === lastMessage.id) return;
    lastSpokenMessageIdRef.current = lastMessage.id;

    const id = lastMessage.id;
    const text = lastMessage.content;
    const lang = isAmazigh ? 'ber' : 'ar';

    fetch(`${API_BASE}/audio/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('TTS failed');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        setSpeakingMessageId(id);
        audio.onended = () => { setSpeakingMessageId(null); URL.revokeObjectURL(url); };
        audio.onerror = () => { setSpeakingMessageId(null); URL.revokeObjectURL(url); };
        audio.play().catch(() => setSpeakingMessageId(null));
      })
      .catch(() => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang === 'ar-SA') || voices.find(v => v.lang.startsWith('ar'));
        if (arabicVoice && !isAmazigh) utterance.voice = arabicVoice;
        utterance.lang = isAmazigh ? 'fr' : 'ar';
        utterance.rate = 0.88;
        utterance.onstart = () => setSpeakingMessageId(id);
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);
        window.speechSynthesis.speak(utterance);
      });
  }, [messages, isAmazigh]);

  const pushAssistantText = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        role: 'assistant',
        type: 'text',
        content: text,
      },
    ]);
  };

  const speakMessage = async (id, text) => {
    if (speakingMessageId === id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setSpeakingMessageId(id);

    try {
      const res = await fetch(`${API_BASE}/audio/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: isAmazigh ? 'ber' : 'ar' }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => { setSpeakingMessageId(null); URL.revokeObjectURL(url); };
        audio.onerror = () => { setSpeakingMessageId(null); URL.revokeObjectURL(url); };
        audio.play();
        return;
      }
    } catch (_) {}

    if (!('speechSynthesis' in window)) { setSpeakingMessageId(null); return; }
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang === 'ar-SA')
      || voices.find(v => v.lang === 'ar')
      || voices.find(v => v.lang.startsWith('ar'));
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isAmazigh ? 'fr' : 'ar';
    if (arabicVoice && !isAmazigh) utterance.voice = arabicVoice;
    utterance.rate = 0.88;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
  };

  const sendTextMessage = async (textOverride = '') => {
    const text = (textOverride || input).trim();
    if (!text) return;

    const userMessage = {
      id: makeId(),
      role: 'user',
      type: 'text',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingContext('chat');

    try {
      const payload = {
        text,
        lang: isAmazigh ? 'amazigh' : 'darija',
        session_id: sessionIdRef.current,
      };

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || 'Erreur API');
      }

      pushAssistantText(data?.response || 'سمح ليا، ما قدرتش نفهم الطلب دابا.');
    } catch (err) {
      pushAssistantText("وقع مشكل تقني. حاول مرة أخرى من فضلك.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingContext('');
    }
  };

  const handleScanCin = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingContext('scan');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/api/document/scan-cin`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || 'Scan CIN failed');
      }

      const citizen = data?.data || data;
      if (!citizen || (!citizen.nom && !citizen.prenom && !citizen.cin)) {
        pushAssistantText(isAmazigh 
          ? 'ⵓⴼⵉⵖ ⵉⵙⴼⴽⴰ ⵓⵔ ⵢⵓⴼⵉ ⵎⵄⵏⴰ. ⵄⴰⵡⴷ ⵟⵟⴼ ⵜⴰⵎⵍⴰⵢⵜ ⵏⵏⵙ ⵜⵓⴼⵉ.'
          : 'ما لقيتش بيانات واضحة فالصورة. جرب صورة أوضح وبضوء مزيان.'
        );
        return;
      }

      const citizenData = {
        nom: citizen.nom || '',
        prenom: citizen.prenom || '',
        cin: citizen.cin || '',
      };

      setValidatedCitizen(citizenData);
      setExtractedData(null);
      
      // Start chat with OCR data
      const welcomeMessage = isAmazigh
        ? `${t.cinWelcome}\n\n• ${t.fullName}: ${citizenData.nom}\n• ${t.surname}: ${citizenData.prenom}\n• ${t.idNumber}: ${citizenData.cin}\n\n${t.cinConfirm} ${t.whatNext}`
        : `${t.cinWelcome}\n\n• الاسم: ${citizenData.nom}\n• النسب: ${citizenData.prenom}\n• CIN: ${citizenData.cin}\n\n${t.cinConfirm} ${t.whatNext}`;

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          type: 'text',
          content: welcomeMessage,
        },
      ]);
      
      setCurrentScreen('chat');
    } catch (err) {
      pushAssistantText(isAmazigh
        ? 'ⵓⵔ ⵢⵓⴼⵉ ⴰⴷ ⵢⵙⵙⵏⵜⵉ ⵜⴰⵡⵍⴰⴼⵜ. ⵄⴰⵡⴷ ⵄⵔⴹ.'
        : 'تعذر تحليل الوثيقة حالياً. أعد المحاولة من فضلك.'
      );
      console.error(err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsLoading(false);
      setLoadingContext('');
    }
  };

  const confirmCitizenData = (data) => {
    setValidatedCitizen(data);
    setExtractedData(null);
    setCurrentScreen('services');
    pushAssistantText(isAmazigh
      ? `${t.confirmedData}: ${data.nom} ${data.prenom} - CIN: ${data.cin}`
      : `تم تأكيد المعطيات: ${data.nom} ${data.prenom} - CIN: ${data.cin}`
    );
  };

  const handleRequestDocument = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user' && m.type === 'text');
    const text = input.trim() || (lastUserMsg?.content ?? '');
    if (!text) {
      pushAssistantText('اكتب أو قل شنو بغيتي من وثيقة — مثلاً: "بغيت شهادة ميلاد ديالي، اسمي محمد، CIN BK123456"');
      return;
    }
    setIsLoading(true);
    setLoadingContext('scan');
    try {
      const res = await fetch(`${API_BASE}/api/watiqati/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: isAmazigh ? 'amazigh' : 'darija' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Extraction failed');
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', type: 'watiqati_confirm', data },
      ]);
    } catch (err) {
      pushAssistantText('ما قدرتش نستخرج المعطيات. عاود الكتابة أو قل اسمك ورقم البطاقة ونوع الوثيقة.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingContext('');
      setInput('');
    }
  };

  const submitWatiqatiRequest = async (data) => {
    setIsLoading(true);
    setLoadingContext('scan');
    try {
      const res = await fetch(`${API_BASE}/api/watiqati/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', type: 'watiqati_result', data: result },
      ]);
    } catch (err) {
      pushAssistantText('وقع مشكل فالإرسال. حاول مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingContext('');
    }
  };

  const processRecordedAudio = async (audioBlob) => {
    setIsLoading(true);
    setLoadingContext('audio');
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.webm');

      const lang = isAmazigh ? 'amazigh' : 'darija';
      const res = await fetch(`${API_BASE}/api/audio/process?lang=${lang}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || 'Audio process failed');
      }

      const text = data?.transcription || data?.text || '';
      if (!text.trim()) {
        pushAssistantText('مسمعتش مزيان التسجيل. عاود من فضلك بصوت أوضح.');
        return;
      }
      setLoadingContext('');
      await sendTextMessage(text);
    } catch (err) {
      pushAssistantText('وقع مشكل فمعالجة الصوت. حاول مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingContext('');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      const rec = mediaRecorderRef.current;
      if (rec?.recognition) rec.recognition.stop();
      else if (rec?.state && rec.state !== 'inactive') rec.stop();
      setIsRecording(false);
      setLoadingContext('');
      return;
    }

    if (isAmazigh) {
      if (!navigator.mediaDevices?.getUserMedia) {
        pushAssistantText('ⵎⵜⵜⴰⵡⵉ ⵓⵙⴷⵓⵙ ⵏ ⵓⵙⵡⵓⵔⵉ — Le navigateur ne supporte pas le microphone.');
        return;
      }
      setIsRecording(true);
      setLoadingContext('listening');
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          chunksRef.current = [];
          const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
          mr.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            processRecordedAudio(blob);
          };
          mediaRecorderRef.current = mr;
          mr.start();
          setTimeout(() => {
            if (mr.state !== 'inactive') mr.stop();
            setIsRecording(false);
            setLoadingContext('');
          }, 8000);
        })
        .catch(() => {
          setIsRecording(false);
          setLoadingContext('');
          pushAssistantText('ⵉⵡⵙ ⴰⵎⵉⴽⵕⵓⴼⵓⵏ — Autorisez le microphone dans le navigateur.');
        });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      pushAssistantText(
        'متصفحك ما يدعمش التسجيل الصوتي مباشرة.\n' +
        'استعمل Chrome أو Edge باش تشتغل هاد الخاصية.'
      );
      return;
    }

    setIsRecording(true);
    setLoadingContext('listening');

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-MA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let resultReceived = false;

    recognition.onresult = (event) => {
      resultReceived = true;
      const transcript = (event.results[0][0].transcript || '').trim();
      setIsRecording(false);
      setLoadingContext('');
      if (transcript) sendTextMessage(transcript);
      else pushAssistantText('مسمعتش مزيان. عاود من فضلك وهضر بوضوح.');
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      setLoadingContext('');
      const msgs = {
        'not-allowed': 'سمح للمتصفح باش يوصل للميكروفون ديالك.',
        'no-speech':   'مسمعتك. هضر بصوت أعلى وعاود.',
        'network':     'خاصك الانترنيت باش يشتغل التسجيل الصوتي.',
        'aborted':     '',
      };
      const msg = msgs[event.error] ?? ('مشكل في التسجيل: ' + event.error);
      if (msg) pushAssistantText(msg);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setLoadingContext('');
      if (!resultReceived) pushAssistantText('مسمعتش صوت. جرب مرة أخرى وهضر قريب من الميكروفون.');
    };

    mediaRecorderRef.current = { recognition };
    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      setLoadingContext('');
      pushAssistantText('فشل تشغيل الميكروفون. جدد الصفحة وحاول مرة أخرى.');
    }
  };

  const startNewChat = async () => {
    try {
      await fetch(`${API_BASE}/api/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          lang: isAmazigh ? 'amazigh' : 'darija',
        }),
      });
    } catch (err) {
      console.warn('Reset backend session failed (non-bloquant):', err);
    }
    setMessages([{
      id: makeId(),
      role: 'assistant',
      type: 'text',
      content: isAmazigh ? TRANSLATIONS.amazigh.welcome : TRANSLATIONS.darija.welcome,
    }]);
    setInput('');
    setValidatedCitizen(null);
    localStorage.removeItem('khidmati_messages_v1');
    localStorage.removeItem('khidmati_validated_citizen_v1');
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentScreen('capture');
  };

  const handleBackToServices = () => {
    setCurrentScreen('services');
    setSelectedService(null);
    setExtractedData(null);
  };

  // ========== SERVICES SCREEN ==========
  if (currentScreen === 'services') {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900"
        style={{ fontFamily: appFontFamily }}
      >
        <div className="max-w-3xl mx-auto p-6">
          {/* Header */}
          <div className="text-center pt-8 pb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">خدمتي AI</h1>
            <p className="text-2xl text-gray-600">{t.selectService}</p>
          </div>

          {/* Language Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setLanguageMode('darija')}
                className={`rounded-xl px-6 py-3 text-base font-semibold transition ${
                  !isAmazigh ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                AR / Darija
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('amazigh')}
                className={`rounded-xl px-6 py-3 text-base font-semibold transition ${
                  isAmazigh ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Languages className="h-5 w-5" /> ⵣ
                </span>
              </button>
            </div>
          </div>

          {/* Service Buttons - Grid Matrix */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className={`${service.color} hover:opacity-90 active:scale-95 transition-all duration-200 rounded-3xl shadow-xl p-5 flex flex-col items-center gap-3`}
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-5xl">{service.emoji}</span>
                </div>
                <span className="text-white text-lg font-bold text-center leading-tight">
                  {isAmazigh ? service.label.amazigh : service.label.darija}
                </span>
              </button>
            ))}
          </div>

          {/* Chat Button at the bottom */}
          <div className="text-center pb-6">
            <p className="text-gray-500 text-lg mb-4">{t.orChat}</p>
            <button
              onClick={() => setCurrentScreen('chat')}
              className="w-full max-w-sm h-20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all rounded-3xl shadow-xl flex items-center justify-center gap-3 mx-auto"
            >
              <Bot className="w-8 h-8 text-white" />
              <span className="text-white text-2xl font-bold">{t.chatButton}</span>
            </button>
          </div>

          {/* Validated Citizen Info */}
          {validatedCitizen && (
            <div className="rounded-2xl bg-white border-2 border-green-200 p-4 shadow-lg mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">✓ {t.confirmedData}:</p>
              <div className="flex gap-6 text-sm">
                <p className="text-gray-800">{`${validatedCitizen.nom || '-'} ${validatedCitizen.prenom || '-'}`}</p>
                <p className="text-gray-800 font-mono">{`CIN: ${validatedCitizen.cin || '-'}`}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== CAPTURE SCREEN ==========
  if (currentScreen === 'capture') {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 text-gray-900"
        style={{ fontFamily: appFontFamily }}
      >
        <div className="max-w-3xl mx-auto p-6">
          {/* Header */}
          <div className="text-center pt-8 pb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${selectedService?.color || 'bg-blue-500'}`}>
              {selectedService?.icon && <selectedService.icon className="w-10 h-10 text-white" />}
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {isAmazigh ? selectedService?.label.amazigh : selectedService?.label.darija}
            </h1>
            <p className="text-xl text-gray-600">{t.captureTitle}</p>
          </div>

          {/* Capture Area */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            {!extractedData ? (
              <div className="aspect-[1.6/1] rounded-2xl border-8 border-dashed border-blue-400 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-100 to-green-100">
                <div className="absolute inset-4 border-4 border-white rounded-xl" />
                <div className="relative z-10 text-center">
                  <Camera className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                  <p className="text-2xl text-gray-700 font-bold">{t.placeCard}</p>
                </div>
                <div className="absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-14 h-14 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-4">{t.dataExtracted}</p>
                <div className="bg-green-50 rounded-2xl p-6 text-right">
                  <p className="text-lg"><strong>{t.fullName}:</strong> {extractedData.nom || '-'}</p>
                  <p className="text-lg"><strong>{t.surname}:</strong> {extractedData.prenom || '-'}</p>
                  <p className="text-lg font-mono"><strong>{t.idNumber}:</strong> {extractedData.cin || '-'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!extractedData ? (
            <div className="space-y-4 pb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 active:scale-95 transition-all rounded-3xl shadow-2xl flex items-center justify-center gap-4"
              >
                <Camera className="w-12 h-12 text-white" />
                <span className="text-white text-3xl font-bold">{t.takePhoto}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleScanCin}
              />
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              <button
                onClick={() => confirmCitizenData(extractedData)}
                disabled={isLoading}
                className="w-full h-24 bg-green-500 hover:bg-green-600 active:scale-95 transition-all rounded-3xl shadow-2xl flex items-center justify-center gap-4 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                    <span className="text-white text-3xl font-bold">{t.analyzing}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12 text-white" />
                    <span className="text-white text-3xl font-bold">{t.confirmData}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setExtractedData(null)}
                className="w-full h-16 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all rounded-2xl shadow-lg flex items-center justify-center gap-3"
              >
                <span className="text-gray-700 text-2xl font-bold">{t.retakePhoto}</span>
              </button>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={handleBackToServices}
            className="w-full h-14 bg-white hover:bg-gray-50 active:scale-95 transition-all rounded-2xl shadow-lg flex items-center justify-center gap-3"
          >
            <ArrowRight className="w-6 h-6 text-gray-700 rotate-180" />
            <span className="text-gray-700 text-xl font-bold">{t.backToServices}</span>
          </button>
        </div>
      </div>
    );
  }

  // ========== CHAT SCREEN ==========
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900"
      style={{ fontFamily: appFontFamily }}
    >
      <div className="mx-auto flex h-screen w-full max-w-5xl flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToServices}
                  className="flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 px-4 py-2 transition"
                >
                  <ArrowRight className="h-5 w-5 rotate-180 text-gray-700" />
                  <span className="text-sm font-semibold text-gray-700">{t.backToServices}</span>
                </button>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t.chatButton}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95"
                  title={t.newChat}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">{t.newChat}</span>
                </button>

                <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLanguageMode('darija')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      !isAmazigh ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    AR
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguageMode('amazigh')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isAmazigh ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ⵣ
                  </button>
                </div>
              </div>
            </div>

            {validatedCitizen && (
              <div className="mt-3 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">✓ {t.confirmedData}:</p>
                <div className="flex gap-4 text-sm">
                  <p className="text-gray-800">{`${validatedCitizen.nom || '-'} ${validatedCitizen.prenom || '-'}`}</p>
                  <p className="text-gray-800 font-mono text-xs">{`CIN: ${validatedCitizen.cin || '-'}`}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[80%] rounded-3xl px-6 py-4 shadow-md text-lg leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-white border-2 border-purple-100 text-gray-800'
                  }`}
                >
                  {message.type === 'validation' ? (
                    <div className="space-y-4">
                      <p className="text-base font-semibold text-gray-700">
                        {isAmazigh 
                          ? 'ⵍⵍⴰⵏ ⵉⵙⴼⴽⴰ ⵏ ⵜⴱⴰⵟⵏⴰ, ⵎⴰⵛⴰ ⵜⵉⴷⵜ ⵉⵙⴼⴽⴰ ⴰ?'
                          : 'تم استخراج بيانات البطاقة، واش تأكد هاد المعلومات؟'
                        }
                      </p>
                      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4 text-sm space-y-2">
                        <p className="text-gray-800"><strong>{isAmazigh ? t.fullName : 'الاسم'}:</strong> {message.data.nom || '-'}</p>
                        <p className="text-gray-800"><strong>{isAmazigh ? t.surname : 'النسب'}:</strong> {message.data.prenom || '-'}</p>
                        <p className="text-gray-800 font-mono"><strong>{isAmazigh ? t.idNumber : 'CIN'}:</strong> {message.data.cin || '-'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => confirmCitizenData(message.data)}
                        className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
                      >
                        ✓ {isAmazigh ? t.confirmData : 'تأكيد هذه البيانات'}
                      </button>
                    </div>
                  ) : message.type === 'watiqati_confirm' ? (
                    <div className="space-y-4">
                      <p className="text-base font-semibold text-gray-700">
                        {isAmazigh 
                          ? 'ⵎⴰⵛⴰ ⵜⵉⴷⵜ ⵉⵙⴼⴽⴰ ⴰ? ⴰⴷ ⵜⵣⵏⵓⵖ ⵖⵔ watiqati.ma'
                          : 'واش هاد المعطيات صحيحة؟ غانرسلها لـ watiqati.ma'
                        }
                      </p>
                      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 text-sm space-y-2">
                        <p className="text-gray-800"><strong>{isAmazigh ? 'ⴰⵏⴰⵡ ⵏ ⵜⵡⵍⴰⴼⵜ' : 'نوع الوثيقة'}:</strong> {message.data.type_document || '-'}</p>
                        <p className="text-gray-800"><strong>{isAmazigh ? t.fullName : 'الاسم'}:</strong> {message.data.nom || '-'}</p>
                        <p className="text-gray-800"><strong>{isAmazigh ? t.surname : 'النسب'}:</strong> {message.data.prenom || '-'}</p>
                        <p className="text-gray-800 font-mono"><strong>{isAmazigh ? t.idNumber : 'CIN'}:</strong> {message.data.cin || '-'}</p>
                        <p className="text-gray-800"><strong>{isAmazigh ? 'ⴰⵙⵙ ⵏ ⵜⵍⴰⵍⵉⵜ' : 'تاريخ الميلاد'}:</strong> {message.data.date_naissance || '-'}</p>
                        {message.data._mock && (
                          <p className="text-xs text-amber-600 mt-2">⚠ {isAmazigh ? 'ⵜⴰⵏⴱⴰⴹⵜ: ⵉⵙⴼⴽⴰ ⵏ ⵜⵙⵔⵊⵉⵜ' : 'تنبيه: بيانات تجريبية'}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => submitWatiqatiRequest(message.data)}
                        className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
                      >
                        ✓ {isAmazigh ? t.confirmRequest : 'تأكيد وإرسال'}
                      </button>
                    </div>
                  ) : message.type === 'watiqati_result' ? (
                    <div className="space-y-4">
                      <p className={`text-base font-semibold ${message.data.success ? 'text-green-600' : 'text-red-600'}`}>
                        {message.data.success 
                          ? (isAmazigh ? '✓ ⵉⵄⵊⴱ! ⵜⵓⵣⵏⴰ ⵜⴰⵙⵓⵜⵍⵜ' : '✓ تم الإرسال بنجاح!')
                          : (isAmazigh ? '✗ ⵢⵓⵔⵉ ⵓⵎⵓⵔ' : '✗ وقع مشكل')
                        }
                      </p>
                      <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
                        <p className="text-gray-800"><strong>{isAmazigh ? 'ⴰⵎⵏⵉⴷ' : 'الحالة'}:</strong> {message.data.status}</p>
                        <p className="text-gray-800"><strong>{isAmazigh ? 'ⵉⵣⵏ' : 'الرسالة'}:</strong> {message.data.message}</p>
                        {message.data.reference && (
                          <p className="text-gray-800"><strong>{isAmazigh ? 'ⵜⵉⵔⵔⴰ' : 'المرجع'}:</strong> <span className="font-mono text-green-700">{message.data.reference}</span></p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {message.role === 'assistant' ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words flex-1">{message.content}</p>
                      </div>
                      {message.role === 'assistant' && message.type === 'text' && (
                        <button
                          type="button"
                          onClick={() => speakMessage(message.id, message.content)}
                          className={`self-end flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                            speakingMessageId === message.id
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {speakingMessageId === message.id ? (
                            <><Square className="h-4 w-4" /> {t.stop}</>
                          ) : (
                            <><Volume2 className="h-4 w-4" /> {t.listen}</>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-center">
                <div className="flex items-center gap-3 rounded-3xl border-2 border-purple-200 bg-white px-6 py-4 shadow-md">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  <span className="text-base font-semibold text-gray-700 md:text-lg">
                    {loadingContext === 'listening'
                      ? t.listening
                      : loadingContext === 'audio'
                      ? t.processingAudio
                      : loadingContext === 'scan'
                      ? t.analyzing
                      : t.thinking}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Footer Input Area */}
        <footer className="border-t border-purple-100 bg-white/80 backdrop-blur-md p-4 md:p-5">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <button
              type="button"
              onClick={handleRequestDocument}
              disabled={isLoading}
              className="min-h-[60px] min-w-[60px] rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
              title={t.document}
              aria-label={t.document}
            >
              <FileText className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[60px] min-w-[60px] rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg transition hover:scale-105 active:scale-95"
              title={t.captureTitle}
              aria-label={t.captureTitle}
            >
              <Camera className="h-6 w-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleScanCin}
            />

            <button
              type="button"
              onClick={toggleRecording}
              className={`min-h-[60px] min-w-[60px] rounded-2xl text-white shadow-lg transition hover:scale-105 active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}
              title={isRecording ? t.stop : t.listen}
              aria-label={isRecording ? t.stop : t.listen}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              rows={1}
              placeholder={isAmazigh ? 'ⵎⴰⵎⴽ ⴰⴷ ⴰⵡⵏⴽ...' : 'اكتب رسالتك...'}
              className="min-h-[60px] flex-1 resize-none rounded-2xl border-2 border-purple-100 bg-gray-50 px-4 py-3 text-base outline-none transition focus:border-purple-400 focus:bg-white"
            />

            <button
              type="button"
              onClick={() => sendTextMessage()}
              disabled={!input.trim() || isLoading}
              className="min-h-[60px] min-w-[60px] rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Envoyer"
              aria-label="Envoyer"
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
