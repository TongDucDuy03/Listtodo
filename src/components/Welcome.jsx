import React, { useState } from 'react';
import { generateSyncCode } from '../lib/supabase';

export default function Welcome({ onStart }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async (syncCode, isNew) => {
    setBusy(true);
    await onStart(syncCode, { isNew });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = code.trim().toLowerCase();
    if (trimmed) start(trimmed, false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <h1>NhanhTodo</h1>
        </div>
        <h2 className="today-heading">Bắt đầu nào</h2>
      </header>

      <main className="sheet welcome">
        <section className="welcome-block">
          <p className="welcome-lead">
            Lần đầu dùng? App sẽ tạo cho bạn một mã danh sách riêng. Việc bạn ghi được lưu theo mã
            này và dùng chung trên mọi thiết bị.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => start(generateSyncCode(), true)}
            disabled={busy}
          >
            Tạo danh sách mới
          </button>
        </section>

        <form className="welcome-block" onSubmit={handleJoin}>
          <label className="form-label" htmlFor="join-code">
            Đã dùng trên máy khác? Nhập mã danh sách
          </label>
          <div className="btn-row">
            <input
              id="join-code"
              className="form-input"
              style={{ flex: 1, minWidth: 0 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="vd: abcd-efgh-jkmn"
              autoComplete="off"
              autoCapitalize="none"
            />
            <button type="submit" className="btn-secondary" disabled={busy || !code.trim()}>
              Dùng mã này
            </button>
          </div>
          <span className="form-hint">
            Mã nằm trong Cài đặt của máy kia. Bấm "Chép link cho thiết bị khác" ở đó rồi mở link trên
            máy này thì không cần nhập.
          </span>
        </form>
      </main>
    </div>
  );
}
