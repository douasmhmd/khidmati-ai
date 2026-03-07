import { useState } from "react";
import { CheckCircle, User, Hash, Calendar, Volume2, ArrowRight } from "lucide-react";

export function DataConfirmation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mock extracted data
  const extractedData = {
    name: "أحمد بن محمد",
    idNumber: "AB123456",
    birthDate: "15/03/1985",
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-6">
        {/* Success animation */}
        <div className="text-center max-w-lg">
          <div className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <CheckCircle className="w-24 h-24 text-white" />
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6" dir="rtl">
              تم بنجاح!
            </h1>
            <p className="text-3xl text-gray-600 leading-relaxed" dir="rtl">
              طلبك قيد المعالجة
            </p>
          </div>

          <div className="bg-blue-100 rounded-2xl p-8 mb-8">
            <p className="text-2xl text-blue-800" dir="rtl">
              رقم المتابعة
            </p>
            <p className="text-4xl font-bold text-blue-900 mt-4">
              #2024-0307-001
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/"}
            className="w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 transition-all duration-200 rounded-3xl shadow-2xl flex items-center justify-center gap-4 text-white"
          >
            <span className="text-3xl font-bold">الرجوع للبداية</span>
            <ArrowRight className="w-12 h-12" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col p-6">
      {/* Header */}
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4" dir="rtl">
          تأكد من المعلومات
        </h1>
        
        {/* Voice read button */}
        <button className="flex items-center gap-3 px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl shadow-lg transition-all duration-200 active:scale-95 mx-auto mt-4">
          <Volume2 className="w-8 h-8" />
          <span className="text-2xl font-bold">اقرأ المعلومات</span>
        </button>
      </div>

      {/* Data cards */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6 py-8">
        {/* Name card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-blue-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xl text-gray-500 mb-2" dir="rtl">الاسم الكامل</p>
              <p className="text-4xl font-bold text-gray-800" dir="rtl">
                {extractedData.name}
              </p>
            </div>
          </div>
        </div>

        {/* ID Number card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-green-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Hash className="w-12 h-12 text-green-600" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xl text-gray-500 mb-2" dir="rtl">رقم البطاقة</p>
              <p className="text-4xl font-bold text-gray-800">
                {extractedData.idNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Birth Date card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-purple-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-12 h-12 text-purple-600" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xl text-gray-500 mb-2" dir="rtl">تاريخ الميلاد</p>
              <p className="text-4xl font-bold text-gray-800">
                {extractedData.birthDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pb-8 space-y-4">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className={`w-full h-28 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 active:scale-95 transition-all duration-200 rounded-3xl shadow-2xl flex items-center justify-center gap-6 ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-4xl font-bold">جاري المعالجة...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-white" />
              <span className="text-white text-4xl font-bold">تأكيد الطلب</span>
            </>
          )}
        </button>

        <button
          onClick={() => window.history.back()}
          disabled={isSubmitting}
          className="w-full h-20 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all duration-200 rounded-2xl shadow-lg flex items-center justify-center gap-4"
        >
          <span className="text-gray-700 text-2xl font-bold">رجوع</span>
        </button>
      </div>

      {/* Helper text */}
      <div className="pb-4 text-center">
        <p className="text-gray-500 text-xl" dir="rtl">
          تأكد من صحة المعلومات قبل التأكيد
        </p>
      </div>
    </div>
  );
}
