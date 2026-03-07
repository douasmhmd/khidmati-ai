import React, { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '../services/api';

// États possibles du bouton microphone
const STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  DONE: 'done',
};

function AudioRecorder({ onTranscription, language, fontSize }) {
  const [status, setStatus] = useState(STATES.IDLE);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        if (blob.size < 1000) {
          setError('تكلم أكثر من ثانية');
          setStatus(STATES.IDLE);
          return;
        }

        setStatus(STATES.PROCESSING);
        const result = await transcribeAudio(blob, language);

        if (result.error) {
          setError('ماكاينش الانترنيت');
          setStatus(STATES.IDLE);
          return;
        }

        setStatus(STATES.DONE);
        onTranscription(result.transcription);

        // Retour à l'état idle après 2 secondes
        setTimeout(() => setStatus(STATES.IDLE), 2000);
      };

      mediaRecorder.start();
      setStatus(STATES.RECORDING);
      setCountdown(30);

      // Vibration haptique au démarrage
      if (navigator.vibrate) navigator.vibrate(100);

      // Compte à rebours
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Arrêt automatique après 30s
      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('خاصك تسمح للميكروفون');
      } else {
        setError('ماكاينش الانترنيت');
      }
      setStatus(STATES.IDLE);
    }
  };

  const stopRecording = () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleClick = () => {
    if (status === STATES.IDLE || status === STATES.DONE) {
      startRecording();
    } else if (status === STATES.RECORDING) {
      stopRecording();
    }
  };

  const getBgColor = () => {
    if (status === STATES.RECORDING) return '#C1272D';
    if (status === STATES.PROCESSING) return '#C8A951';
    if (status === STATES.DONE) return '#006233';
    return '#C1272D';
  };

  const getLabel = () => {
    if (status === STATES.RECORDING) return `⏹ ${countdown}`;
    if (status === STATES.PROCESSING) return '⏳';
    if (status === STATES.DONE) return '✅';
    return '🎤';
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={status === STATES.PROCESSING}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md disabled:opacity-60 transition-all duration-200 ${
          status === STATES.RECORDING ? 'animate-pulse-moroccan' : ''
        }`}
        style={{ backgroundColor: getBgColor(), minWidth: 48, minHeight: 48, fontSize }}
        aria-label={status === STATES.RECORDING ? 'أوقف التسجيل' : 'ابدأ التسجيل'}
        title={status === STATES.IDLE ? 'اضغط للتكلم' : ''}
      >
        {getLabel()}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-1 text-center max-w-16">{error}</p>
      )}
    </div>
  );
}

export default AudioRecorder;
