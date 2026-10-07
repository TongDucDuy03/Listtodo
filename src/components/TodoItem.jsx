import React, { useState } from 'react';
import { Check, Trash2, Pencil } from 'lucide-react';
import { playDoneSound } from '../lib/sound';
import { todayStr } from '../lib/date';

const formatShortDate = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

export default function TodoItem({ todo, onToggleComplete, onDelete, onUpdateText }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const today = todayStr();
  const isToday = todo.due_date === today;
  const isOverdue = todo.due_date && todo.due_date < today && !todo.completed;
  const priority = todo.priority || 'normal';

  const handleToggle = () => {
    const nextCompleted = !todo.completed;
    if (nextCompleted) {
      playDoneSound();
    }
    onToggleComplete(todo.id, nextCompleted);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== todo.text) {
      onUpdateText(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  const hasTags = Array.isArray(todo.tags) && todo.tags.length > 0;
  const showDate = todo.due_date && !isToday;

  return (
    <div className={`todo-item ${priority} ${todo.completed ? 'completed' : ''}`}>
      {/* Đánh dấu ưu tiên ngoài lề, giống cú pháp !gap / !qt */}
      <span
        className="todo-mark"
        title={priority === 'urgent' ? 'Gấp' : priority === 'high' ? 'Quan trọng' : undefined}
      >
        {!todo.completed && (priority === 'urgent' ? '!!' : priority === 'high' ? '!' : '')}
      </span>

      <button
        type="button"
        className={`checkbox-btn ${todo.completed ? 'checked' : ''}`}
        onClick={handleToggle}
        aria-label={todo.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong'}
      >
        {todo.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="todo-body">
        {isEditing ? (
          <input
            type="text"
            className="edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            aria-label="Sửa nội dung việc"
            autoFocus
          />
        ) : (
          <div
            className="todo-text"
            onDoubleClick={() => setIsEditing(true)}
            title="Nhấp đúp để sửa"
          >
            {todo.text}
          </div>
        )}

        {(showDate || hasTags) && (
          <div className="todo-meta">
            {showDate && (
              <span className={isOverdue ? 'overdue' : ''}>
                {isOverdue ? `Quá hạn ${formatShortDate(todo.due_date)}` : `Hạn ${formatShortDate(todo.due_date)}`}
              </span>
            )}
            {hasTags &&
              todo.tags.map((tag, idx) => (
                <span key={idx} className="tag">
                  #{tag}
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="todo-actions">
        <button
          type="button"
          className="action-btn"
          onClick={() => setIsEditing(!isEditing)}
          title="Sửa"
          aria-label="Sửa việc"
        >
          <Pencil size={14} />
        </button>

        <button
          type="button"
          className="action-btn danger"
          onClick={() => onDelete(todo.id)}
          title="Xóa"
          aria-label="Xóa việc"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
