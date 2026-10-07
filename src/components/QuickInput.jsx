import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Plus, AlertCircle } from 'lucide-react';
import { startSpeechRecognition, stopSpeechRecognition, isSpeechSupported } from '../lib/speech';
import { parseQuickInput } from '../lib/parser';
import { playAddSound } from '../lib/sound';

export default function QuickInput({ onAddTask }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const inputRef = useRef(null);

  const speechSupported = isSpeechSupported();

  // Watch text for smart syntax like !gap or !qt
  useEffect(() => {
    if (text.includes('!gap') || text.includes('!khancap')) {
      setPriority('urgent');
    } else if (text.includes('!qt') || text.includes('!quantrong')) {
      setPriority('high');
    }
  }, [text]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
      setLiveTranscript('');
      return;
    }

    setSpeechError('');
    setIsListening(true);
    setLiveTranscript('');

    startSpeechRecognition({
      lang: 'vi-VN',
      onResult: (result) => {
        setLiveTranscript(result.text);
        setText(result.text);
      },
      onError: (err) => {
        console.warn('Speech error:', err);
        setSpeechError(typeof err === 'string' ? err : 'Không ghi âm được. Hãy cho phép trình duyệt dùng micro.');
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    // Parse text to extract flags or clean content
    const parsed = parseQuickInput(text);
    const finalPriority = parsed.priority !== 'normal' ? parsed.priority : priority;
    const finalDate = parsed.dueDate || dueDate;

    onAddTask({
      text: parsed.text || text.trim(),
      priority: finalPriority,
      due_date: finalDate,
      tags: parsed.tags
    });

    playAddSound();
    setText('');
    setLiveTranscript('');
    // Keep priority and date ready for next quick input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const setToday = () => {
    setDueDate(new Date().toISOString().split('T')[0]);
  };

  const setTomorrow = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    setDueDate(tmr.toISOString().split('T')[0]);
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  return (
    <form className="quick-input" onSubmit={handleSubmit}>
      <div className="input-main-row">
        <span className="input-margin" aria-hidden="true">
          <Plus size={18} />
        </span>

        <input
          ref={inputRef}
          id="quick-todo-input"
          className="task-input"
          type="text"
          placeholder="Thêm việc, vd: Họp 15h !gap #congty"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Nội dung việc mới"
        />

        <button
          type="button"
          id="voice-input-btn"
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={handleToggleVoice}
          title={
            speechSupported
              ? isListening
                ? 'Dừng nghe'
                : 'Nói để nhập việc'
              : 'Trình duyệt này không hỗ trợ nhập bằng giọng nói'
          }
          aria-label={isListening ? 'Dừng nghe' : 'Nói để nhập việc'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          type="submit"
          id="add-todo-btn"
          className="add-submit-btn"
          disabled={!text.trim()}
          title="Thêm việc (Enter)"
        >
          Thêm
        </button>
      </div>

      {isListening && (
        <div className="voice-note" aria-live="polite">
          {liveTranscript || 'Đang nghe…'}
        </div>
      )}

      {speechError && (
        <div className="voice-note warn">
          <AlertCircle size={14} />
          <span>{speechError}</span>
        </div>
      )}

      <div className="input-sub-row">
        <div className="option-group" role="group" aria-label="Mức ưu tiên">
          {[
            { id: 'urgent', label: 'Gấp' },
            { id: 'high', label: 'Quan trọng' },
            { id: 'normal', label: 'Thường' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={priority === p.id}
              className={`option-btn ${priority === p.id ? `active ${p.id}` : ''}`}
              onClick={() => setPriority(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="option-group" role="group" aria-label="Hạn làm">
          <button
            type="button"
            aria-pressed={dueDate === todayIso}
            className={`option-btn ${dueDate === todayIso ? 'active' : ''}`}
            onClick={setToday}
          >
            Hôm nay
          </button>
          <button
            type="button"
            aria-pressed={dueDate === tomorrowIso}
            className={`option-btn ${dueDate === tomorrowIso ? 'active' : ''}`}
            onClick={setTomorrow}
          >
            Ngày mai
          </button>
          <input
            type="date"
            className="date-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Chọn ngày khác"
          />
        </div>
      </div>
    </form>
  );
}
