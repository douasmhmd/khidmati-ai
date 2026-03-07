import { useNavigate } from "react-router";
import { Globe } from "lucide-react";

export function LanguageSelection() {
  const navigate = useNavigate();

  const handleLanguageSelect = (language: string) => {
    // Store selected language
    localStorage.setItem("selectedLanguage", language);
    navigate("/voice");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center p-6">
      {/* Logo/Icon */}
      <div className="mb-12">
        <div className="w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center">
          <Globe className="w-16 h-16 text-blue-600" />
        </div>
      </div>

      {/* Title with icon */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          مرحبا
        </h1>
        <p className="text-2xl text-gray-600">
          اختر لغتك
        </p>
      </div>

      {/* Language buttons */}
      <div className="w-full max-w-md space-y-6">
        {/* Arabic - Red */}
        <button
          onClick={() => handleLanguageSelect("arabic")}
          className="w-full h-28 bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-200 rounded-3xl shadow-2xl flex items-center justify-center gap-6 px-8"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <span className="text-5xl">🇲🇦</span>
          </div>
          <span className="text-white text-4xl font-bold">العربية</span>
        </button>

        {/* Darija - Blue */}
        <button
          onClick={() => handleLanguageSelect("darija")}
          className="w-full h-28 bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all duration-200 rounded-3xl shadow-2xl flex items-center justify-center gap-6 px-8"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <span className="text-5xl">🗣️</span>
          </div>
          <span className="text-white text-4xl font-bold">الدارجة</span>
        </button>

        {/* Amazigh - Green */}
        <button
          onClick={() => handleLanguageSelect("amazigh")}
          className="w-full h-28 bg-green-500 hover:bg-green-600 active:scale-95 transition-all duration-200 rounded-3xl shadow-2xl flex items-center justify-center gap-6 px-8"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <span className="text-5xl">ⵣ</span>
          </div>
          <span className="text-white text-4xl font-bold">ⴰⵎⴰⵣⵉⵖ</span>
        </button>
      </div>

      {/* Helper text */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-xl">
          اضغط على اللون المفضل
        </p>
      </div>
    </div>
  );
}
