import React, { useRef, useState } from 'react';
import { uploadDocument } from '../services/api';

function DocumentUpload({ onExtracted }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Compression de l'image via Canvas (max 1024px, JPEG 85%)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxSize = 1024;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };
      img.src = url;
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prévisualisation
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadDocument(compressed, 'auto');
      onExtracted(result);
    } finally {
      setLoading(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="doc-upload"
        aria-label="Télécharger un document"
      />
      <label
        htmlFor="doc-upload"
        className="cursor-pointer flex items-center justify-center rounded-full text-white shadow-md"
        style={{
          backgroundColor: loading ? '#6B7280' : '#2563EB',
          width: 48,
          height: 48,
          minWidth: 48,
          minHeight: 48,
        }}
        title="تحميل وثيقة / Télécharger un document"
      >
        {loading ? (
          <span className="animate-spin text-lg">⏳</span>
        ) : preview ? (
          <img
            src={preview}
            alt="aperçu"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span className="text-xl">📷</span>
        )}
      </label>
    </div>
  );
}

export default DocumentUpload;
