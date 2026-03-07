import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Camera, CheckCircle, RotateCcw, Volume2, Loader2 } from "lucide-react";
import { scanCIN, playTTS } from "../api";

const TTS_LANG: Record<string, string> = { arabic: "ar", darija: "ar", amazigh: "ber" };

export function DocumentCapture() {
  const navigate = useNavigate();
  const lang = localStorage.getItem("selectedLanguage") || "darija";
  const ttsLang = TTS_LANG[lang] || "ar";

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const speakInstruction = async (text: string) => {
    const audio = await playTTS(text, ttsLang);
    if (audio) { audio.play().catch(() => {}); }
    else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = ttsLang === "ber" ? "fr" : "ar";
      window.speechSynthesis.speak(u);
    }
  };

  const handleConfirm = async () => {
    if (!capturedFile) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await scanCIN(capturedFile);
      const citizen = result?.data || result;
      // Store extracted data in localStorage for DataConfirmation screen
      localStorage.setItem("extractedCIN", JSON.stringify({
        nom: citizen?.nom || "",
        prenom: citizen?.prenom || "",
        cin: citizen?.cin || "",
        _mock: result?._mock || false,
      }));
      navigate("/confirm");
    } catch {
      setError("ما قدرتش نحلل الوثيقة. تأكد من وضوح الصورة وحاول مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col p-6" dir="rtl">
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">التقط صورة البطاقة</h1>
        <button
          onClick={() => speakInstruction("ضع البطاقة الوطنية في الإطار وتأكد من وضوح الصورة، ثم اضغط التقط الصورة.")}
          className="flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-lg transition-all active:scale-95 mx-auto mt-4"
        >
          <Volume2 className="w-8 h-8" />
          <span className="text-2xl font-bold">اسمع الشرح</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          {!capturedImage ? (
            <div>
              <div className="bg-white rounded-3xl shadow-2xl p-8 aspect-[1.6/1] flex items-center justify-center relative overflow-hidden border-8 border-dashed border-blue-400">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 opacity-50" />
                <div className="relative z-10 w-full h-full border-4 border-white rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-24 h-24 text-blue-500 mx-auto mb-4" />
                    <p className="text-2xl text-gray-700 font-bold">ضع البطاقة هنا</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 w-12 h-12 border-t-8 border-l-8 border-green-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-8 border-r-8 border-green-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-8 border-l-8 border-green-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-8 border-r-8 border-green-500 rounded-br-lg" />
              </div>
              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 text-center">
                <p className="text-2xl text-gray-700">تأكد أن البطاقة واضحة في الإطار</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-4 border-8 border-green-400">
                <img src={capturedImage} alt="Captured document" className="w-full h-auto rounded-2xl" />
              </div>
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-300 rounded-2xl p-4 text-center text-red-700 text-xl">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="pb-8 pt-8">
        {!capturedImage ? (
          <button
            onClick={handleCapture}
            className="w-full h-28 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 active:scale-95 transition-all rounded-3xl shadow-2xl flex items-center justify-center gap-6"
          >
            <Camera className="w-16 h-16 text-white" />
            <span className="text-white text-4xl font-bold">التقط الصورة</span>
          </button>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="w-full h-28 bg-green-500 hover:bg-green-600 active:scale-95 transition-all rounded-3xl shadow-2xl flex items-center justify-center gap-6 disabled:opacity-75"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-14 h-14 text-white animate-spin" />
                  <span className="text-white text-4xl font-bold">جاري التحليل...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-16 h-16 text-white" />
                  <span className="text-white text-4xl font-bold">تأكيد وتحليل</span>
                </>
              )}
            </button>
            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="w-full h-20 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all rounded-2xl shadow-lg flex items-center justify-center gap-4 disabled:opacity-50"
            >
              <RotateCcw className="w-10 h-10 text-gray-700" />
              <span className="text-gray-700 text-2xl font-bold">إعادة التصوير</span>
            </button>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
