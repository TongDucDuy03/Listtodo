import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload } from 'lucide-react';
import { getShareLink } from '../lib/supabase';
import { requestNotificationPermission } from '../lib/notifications';

export default function SettingsModal({
  isOpen,
  onClose,
  syncCode,
  onChangeCode,
  todos,
  onImportTodos
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [notificationStatus, setNotificationStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  if (!isOpen) return null;

  const shareLink = getShareLink(syncCode);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      window.prompt('Chép link này và mở trên thiết bị khác:', shareLink);
    }
  };

  const handleSwitchCode = (e) => {
    e.preventDefault();
    const trimmed = newCode.trim().toLowerCase();
    if (!trimmed || trimmed === syncCode) return;
    onChangeCode(trimmed);
    setNewCode('');
    onClose();
  };

  const handleRequestNotification = async () => {
    const res = await requestNotificationPermission();
    setNotificationStatus(res);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(todos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nhanhtodo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result);
        if (Array.isArray(imported)) {
          onImportTodos(imported);
          alert(`Đã khôi phục ${imported.length} việc.`);
        }
      } catch {
        alert('Không đọc được file. Hãy chọn file .json được tải từ NhanhTodo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="settings-title">Cài đặt</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="form-group">
          <span className="form-label">Mã danh sách của bạn</span>
          <code className="code-display">{syncCode}</code>
          <span className="form-hint">
            Ai có mã này sẽ xem và sửa được danh sách, nên chỉ mở link trên máy của chính bạn.
          </span>
        </div>

        <button type="button" className="btn-primary" onClick={handleCopyLink}>
          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
          {copiedLink ? 'Đã chép link' : 'Chép link cho thiết bị khác'}
        </button>
        <span className="form-hint" style={{ marginTop: -10 }}>
          Gửi link cho chính bạn (Zalo, email…) rồi mở trên điện thoại. Danh sách sẽ tự hiện, không cần
          nhập gì.
        </span>

        <form className="modal-section" onSubmit={handleSwitchCode}>
          <label className="form-label" htmlFor="switch-code">Chuyển sang mã khác</label>
          <div className="btn-row">
            <input
              id="switch-code"
              className="form-input"
              style={{ flex: 1, minWidth: 0 }}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="vd: abcd-efgh-jkmn"
              autoComplete="off"
              autoCapitalize="none"
            />
            <button type="submit" className="btn-secondary" disabled={!newCode.trim()}>
              Chuyển
            </button>
          </div>
        </form>

        <section className="modal-section">
          <h3>Cài app lên máy</h3>
          <ul className="install-steps">
            <li>
              <strong>iPhone, iPad (Safari):</strong> bấm nút Chia sẻ, chọn “Thêm vào MH chính”.
            </li>
            <li>
              <strong>Android (Chrome):</strong> bấm dấu ba chấm, chọn “Cài đặt ứng dụng”.
            </li>
            <li>
              <strong>Máy tính:</strong> bấm biểu tượng cài đặt ở cuối thanh địa chỉ.
            </li>
          </ul>
        </section>

        <section className="modal-section">
          <h3>Nhắc việc và sao lưu</h3>
          <div className="setting-row">
            <span>Thông báo nhắc việc gấp</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRequestNotification}
              disabled={notificationStatus === 'granted'}
            >
              {notificationStatus === 'granted' ? 'Đã bật' : 'Bật thông báo'}
            </button>
          </div>

          <div className="btn-row">
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleExportData}>
              <Download size={14} /> Tải bản sao lưu
            </button>
            <label className="btn-secondary" style={{ flex: 1 }}>
              <Upload size={14} /> Khôi phục từ file
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
