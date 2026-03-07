import { useNavigate } from "react-router";
import { FileText, CreditCard, Plane, Shield, Home, Volume2 } from "lucide-react";
import { playTTS } from "../api";

const TTS_LANG: Record<string, string> = { arabic: "ar", darija: "ar", amazigh: "ber" };

export function Services() {
  const navigate = useNavigate();
  const lang = localStorage.getItem("selectedLanguage") || "darija";
  const ttsLang = TTS_LANG[lang] || "ar";

  const services = [
    { id: "birth",     icon: FileText,   color: "bg-blue-500",   label: "شهادة الميلاد",   emoji: "👶" },
    { id: "id",        icon: CreditCard, color: "bg-green-500",  label: "البطاقة الوطنية", emoji: "🪪" },
    { id: "passport",  icon: Plane,      color: "bg-purple-500", label: "جواز السفر",       emoji: "✈️" },
    { id: "criminal",  icon: Shield,     color: "bg-orange-500", label: "السجل العدلي",     emoji: "📋" },
    { id: "residence", icon: Home,       color: "bg-red-500",    label: "شهادة السكنى",     emoji: "🏠" },
  ];

  const handleServiceClick = (serviceId: string, label: string) => {
    localStorage.setItem("selectedService", serviceId);
    localStorage.setItem("selectedServiceLabel", label);
    navigate("/capture");
  };

  const handleReadAloud = async () => {
    const text = services.map((s) => s.label).join("، ");
    const audio = await playTTS(text, ttsLang);
    if (audio) {
      audio.play().catch(() => {});
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = ttsLang === "ber" ? "fr" : "ar";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col p-6" dir="rtl">
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">اختر الخدمة</h1>
        <p className="text-2xl text-gray-600">اضغط على ما تحتاج</p>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleReadAloud}
          className="flex items-center gap-3 px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl shadow-lg transition-all active:scale-95"
        >
          <Volume2 className="w-8 h-8" />
          <span className="text-2xl font-bold">استمع للخيارات</span>
        </button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id, service.label)}
              className={`${service.color} hover:opacity-90 active:scale-95 transition-all duration-200 rounded-3xl shadow-2xl p-8 flex items-center gap-6`}
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-6xl">{service.emoji}</span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-white text-3xl font-bold">{service.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-8 pb-4 text-center">
        <p className="text-gray-500 text-xl">اضغط على الزر الكبير</p>
      </div>
    </div>
  );
}
