import React from 'react';

function ChecklistView({ checklist, highContrast, onClose }) {
  if (!checklist) return null;

  const containerStyle = highContrast
    ? { backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: 16 }
    : { backgroundColor: '#fff', color: '#1a1a1a', border: '2px solid #C8A951', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,98,51,0.12)' };

  const headerStyle = highContrast
    ? { background: '#333', borderRadius: '14px 14px 0 0', padding: '12px 16px', borderBottom: '1px solid #555' }
    : { background: 'linear-gradient(135deg, #006233 0%, #004D2B 100%)', borderRadius: '14px 14px 0 0', padding: '12px 16px', borderBottom: '2px solid #C8A951' };

  const guichetStyle = highContrast
    ? { backgroundColor: '#222', borderRadius: 10, padding: 12 }
    : { backgroundColor: '#F0F7F4', borderRadius: 10, padding: 12, border: '1px solid #C8A951' };

  return (
    <div style={containerStyle} dir="rtl">
      {/* En-tête */}
      <div style={headerStyle} className="flex items-center justify-between">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <span style={{ color: '#C8A951' }}>★</span>
          {checklist.title}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white transition-opacity duration-200"
            style={{ opacity: 0.7, fontSize: 18 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            aria-label="Fermer la checklist"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Liste des documents */}
        {checklist.documents && checklist.documents.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#006233' }}>
              الوثائق المطلوبة :
            </p>
            <ul className="space-y-1">
              {checklist.documents.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span style={{ color: doc.obligatoire ? '#006233' : '#C8A951', minWidth: 18 }}>
                    {doc.obligatoire ? '✔' : '○'}
                  </span>
                  <span>{doc.nom}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guichet recommandé */}
        {checklist.guichet_recommande && (
          <div style={guichetStyle}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#006233' }}>
              🏢 المكتب المقترح :
            </p>
            <p className="text-sm font-medium">{checklist.guichet_recommande.nom}</p>
            <p className="text-xs mt-1" style={{ color: '#555' }}>📍 {checklist.guichet_recommande.adresse}</p>
            {checklist.guichet_recommande.horaires && (
              <p className="text-xs" style={{ color: '#555' }}>⏰ {checklist.guichet_recommande.horaires}</p>
            )}
            {checklist.guichet_recommande.telephone && (
              <p className="text-xs" style={{ color: '#555' }}>📞 {checklist.guichet_recommande.telephone}</p>
            )}
          </div>
        )}

        {/* Message final */}
        {checklist.message_final && (
          <p
            className="text-sm font-semibold text-center py-2 rounded-lg"
            style={{ color: '#006233', backgroundColor: highContrast ? '#1a1a1a' : '#F0F7F4', border: '1px solid #C8A951' }}
          >
            {checklist.message_final}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChecklistView;
