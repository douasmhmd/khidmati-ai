import React from 'react';

function ChecklistView({ checklist, highContrast, onClose }) {
  if (!checklist) return null;

  const bgClass = highContrast ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200';

  return (
    <div className={`rounded-xl border p-4 shadow-md ${bgClass}`} dir="rtl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base">{checklist.title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
            aria-label="Fermer la checklist"
          >
            ✕
          </button>
        )}
      </div>

      {/* Liste des documents */}
      {checklist.documents && checklist.documents.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-semibold mb-2 opacity-70">الوثائق المطلوبة :</p>
          <ul className="space-y-1">
            {checklist.documents.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span>{doc.obligatoire ? '✅' : '⬜'}</span>
                <span>{doc.nom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guichet recommandé */}
      {checklist.guichet_recommande && (
        <div className={`rounded-lg p-3 mb-3 ${highContrast ? 'bg-gray-800' : 'bg-green-50'}`}>
          <p className="text-sm font-semibold mb-1">🏢 المكتب المقترح :</p>
          <p className="text-sm font-medium">{checklist.guichet_recommande.nom}</p>
          <p className="text-xs opacity-70">📍 {checklist.guichet_recommande.adresse}</p>
          {checklist.guichet_recommande.horaires && (
            <p className="text-xs opacity-70">⏰ {checklist.guichet_recommande.horaires}</p>
          )}
          {checklist.guichet_recommande.telephone && (
            <p className="text-xs opacity-70">📞 {checklist.guichet_recommande.telephone}</p>
          )}
        </div>
      )}

      {/* Message final */}
      {checklist.message_final && (
        <p className="text-sm font-medium text-center" style={{ color: '#0A6E5C' }}>
          {checklist.message_final}
        </p>
      )}
    </div>
  );
}

export default ChecklistView;
