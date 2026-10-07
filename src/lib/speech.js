// Vietnamese Voice-to-Text utility using Web Speech API

export function isSpeechSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

let activeRecognition = null;

export function startSpeechRecognition({ onResult, onEnd, onError, lang = 'vi-VN' }) {
  if (!isSpeechSupported()) {
    if (onError) onError('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech.');
    return null;
  }

  // Stop active if any
  stopSpeechRecognition();

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRec();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({
        final: finalTranscript.trim(),
        interim: interimTranscript.trim(),
        text: (finalTranscript || interimTranscript).trim()
      });
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    activeRecognition = null;
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
    activeRecognition = recognition;
    return recognition;
  } catch (err) {
    if (onError) onError(err.message || 'Không thể khởi động micro');
    return null;
  }
}

export function stopSpeechRecognition() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // Ignore
    }
    activeRecognition = null;
  }
}
