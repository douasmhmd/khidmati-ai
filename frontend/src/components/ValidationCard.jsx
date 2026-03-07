import React, { useState } from 'react';

const ValidationCard = ({ data, onConfirm, onReject, isProcessing = false }) => {
  const [editedData, setEditedData] = useState(data);

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">تأكيد المعلومات المستخرجة</h3>

      <div className="space-y-4">
        {Object.entries(editedData).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {key === 'nom' ? 'الاسم العائلي' :
               key === 'prenom' ? 'الاسم الشخصي' :
               key === 'cin' ? 'رقم البطاقة الوطنية' :
               key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => onReject && onReject()}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 min-h-[80px] text-lg"
          disabled={isProcessing}
        >
          رفض
        </button>
        <button
          onClick={() => onConfirm && onConfirm(editedData)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 min-h-[80px] text-lg"
          disabled={isProcessing}
        >
          تأكيد
        </button>
      </div>
    </div>
  );
};

export default ValidationCard;
