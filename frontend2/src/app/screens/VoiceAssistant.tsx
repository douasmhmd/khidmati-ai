import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Mic, Volume2, ArrowRight, Square } from "lucide-react";
import { sendChat, playTTS, transcribeAudio, resetChat } from "../api";

const SESSION_ID = `session_${Date.now()}`;

const GREETINGS: Record<string, string> = {
  arabic: "مرحباً، أنا خدمتي، مساعدك الإداري. بماذا يمكنني مساعدتك؟",
  darija: "مرحبا، أنا خدمتي. قولي شنو خاصك اليوم؟",
  amazigh: "ⴰⵣⵓⵍ! Nek d Khidmati. Matta tebɣiḍ?",
};

const TTS_LANG: Record<string, string> = {
  arabic: "ar",
  darija: "ar",
  amazigh: "ber",
};

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function VoiceAssistant() {
  const navigate = useNavigate();
  const lang = localStorage.getItem("selectedLanguage") || "darija";
  const ttsLang = TTS_LANG[lang] || "ar";
  const isAmazigh = lang === "amazigh";

  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("");

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Greeting on mount
  useEffect(() => {
    const greeting = GREETINGS[lang] || GREETINGS.darija;
    setMessages([{ role: "assistant", text: greeting }]);
    setTimeout(() => speakText(greeting), 600);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(true);
    const audio = await playTTS(text, ttsLang);
    if (audio) {
      currentAudioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); currentAudioRef.current = null; };
      audio.play().catch(() => setIsSpeaking(false));
    } else {
      // fallback speechSynthesis
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = isAmazigh ? "fr" : "ar";
        u.rate = 0.9;
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      } else {
        setIsSpeaking(false);
      }
    }
  };

  const stopSpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const sendMessage = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);
    setStatusText(isAmazigh ? "ⵜⵜⵓⵙⵙⴰⵏⵖ..." : "يفكر الوكيل...");
    try {
      const data = await sendChat(text, lang, SESSION_ID);
      const reply = data.response || "...";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      await speakText(reply);
    } catch {
      const err = isAmazigh ? "ⵉⵡⵙ ⵓⵙⵓⵙⵙⵏ. ⵔⵓ ⴷⴰⴷⵙ." : "وقع مشكل، عاود من فضلك.";
      setMessages((prev) => [...prev, { role: "assistant", text: err }]);
    } finally {
      setIsLoading(false);
      setStatusText("");
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      // STOP
      if (isAmazigh) {
        mediaRecorderRef.current?.stop();
      } else {
        (mediaRecorderRef.current as any)?.recognition?.stop();
      }
      setIsListening(false);
      setStatusText("");
      return;
    }

    stopSpeech();
    setIsListening(true);
    setStatusText(isAmazigh ? "ⵜⵜⵓⵙⵙⴰⵏⵖ... ⵔⵓ ⴷⴰⴷⵙ" : "جاري الاستماع... تكلم الآن");

    if (isAmazigh) {
      // MediaRecorder → backend Odyssey
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          chunksRef.current = [];
          const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
          mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
          mr.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            setIsListening(false);
            setStatusText("");
            setIsLoading(true);
            try {
              const result = await transcribeAudio(blob, "amazigh");
              if (result.transcription) await sendMessage(result.transcription);
            } catch {
              setIsLoading(false);
            }
          };
          mediaRecorderRef.current = mr;
          mr.start();
          // Auto-stop after 8s
          setTimeout(() => { if (mr.state !== "inactive") mr.stop(); }, 8000);
        })
        .catch(() => {
          setIsListening(false);
          setStatusText("");
        });
    } else {
      // Web Speech API for Darija/Arabic
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        setIsListening(false);
        setStatusText("");
        setMessages((prev) => [...prev, { role: "assistant", text: "استعمل Chrome أو Edge لتفعيل الميكروفون." }]);
        return;
      }
      const recognition = new SR();
      recognition.lang = "ar-MA";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      let got = false;
      recognition.onresult = (e: any) => {
        got = true;
        const transcript = (e.results[0][0].transcript || "").trim();
        setIsListening(false);
        setStatusText("");
        if (transcript) sendMessage(transcript);
      };
      recognition.onerror = () => { setIsListening(false); setStatusText(""); };
      recognition.onend = () => {
        setIsListening(false);
        setStatusText("");
        if (!got) setMessages((prev) => [...prev, { role: "assistant", text: "مسمعتش مزيان. عاود وهضر بوضوح." }]);
      };
      (mediaRecorderRef.current as any) = { recognition };
      recognition.start();
    }
  };

  const handleNewChat = async () => {
    stopSpeech();
    await resetChat(SESSION_ID, lang);
    const greeting = GREETINGS[lang] || GREETINGS.darija;
    setMessages([{ role: "assistant", text: greeting }]);
    setTimeout(() => speakText(greeting), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="pt-10 pb-4 text-center px-6">
        <div className={`w-20 h-20 rounded-full shadow-lg flex items-center justify-center mx-auto mb-4 transition-all ${
          isSpeaking ? "bg-purple-500 animate-pulse scale-110" : "bg-purple-400"
        }`}>
          <Volume2 className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">مساعدك الحكومي</h1>
        {statusText && (
          <p className="text-lg text-purple-600 font-semibold mt-2 animate-pulse">{statusText}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 max-w-2xl w-full mx-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-md text-xl leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-800 border-2 border-purple-100"
            }`}>
              {msg.text}
              {msg.role === "assistant" && (
                <button
                  onClick={() => isSpeaking ? stopSpeech() : speakText(msg.text)}
                  className="mt-2 flex items-center gap-2 text-sm text-purple-500 hover:text-purple-700"
                >
                  {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isSpeaking ? "إيقاف" : "استمع"}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-white rounded-3xl px-6 py-4 shadow-md border-2 border-purple-100 flex gap-2 items-center">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-4 pb-6 pt-4">
        <button
          onClick={handleMicClick}
          disabled={isLoading}
          className={`w-36 h-36 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isListening
              ? "bg-red-500 animate-pulse scale-110"
              : "bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-110 active:scale-100"
          } disabled:opacity-50`}
        >
          {isListening ? <Square className="w-16 h-16 text-white" /> : <Mic className="w-20 h-20 text-white" />}
        </button>

        {isListening && (
          <div className="flex gap-2">
            {[0, 150, 300].map((d) => (
              <div key={d} className="w-4 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/services")}
            className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <span className="text-xl text-gray-700">الخدمات</span>
            <ArrowRight className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={handleNewChat}
            className="px-8 py-4 bg-purple-100 hover:bg-purple-200 rounded-2xl shadow text-purple-700 text-xl transition-all active:scale-95"
          >
            محادثة جديدة
          </button>
        </div>
      </div>
    </div>
  );
}
