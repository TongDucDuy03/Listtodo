import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload } from 'lucide-react';
import { SUPABASE_SQL_SETUP, saveConfig, getSavedConfig } from '../lib/supabase';
import { requestNotificationPermission, isNotificationSupported } from '../lib/notifications';

export default function SettingsModal({
  isOpen,
  onClose,
  onConfigSaved,
  todos,
  onImportTodos
}) {
  const currentConfig = getSavedConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [syncCode, setSyncCode] = useState(currentConfig.syncCode);
  const [copiedSql, setCopiedSql] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveConfig({ url, key, syncCode });
    onConfigSaved({ url, key, syncCode });
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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
      } catch (err) {
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

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sync-code">Mã đồng bộ</label>
            <input
              id="sync-code"
              type="text"
              className="form-input"
              value={syncCode}
              onChange={(e) => setSyncCode(e.target.value)}
              placeholder="vd: nha-minh hoặc 9999"
              required
            />
            <span className="form-hint">
              Nhập cùng một mã trên điện thoại và máy tính để thấy chung danh sách việc.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sb-url">Supabase URL</label>
            <input
              id="sb-url"
              type="text"
              className="form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sb-key">Supabase anon key</label>
            <input
              id="sb-key"
              type="password"
              className="form-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            />
            <span className="form-hint">
              Để trống nếu chỉ dùng trên một máy. Dữ liệu sẽ lưu ngay trong trình duyệt.
            </span>
          </div>

          {url && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-label">Lệnh SQL tạo bảng</span>
                <button type="button" className="link-btn" onClick={handleCopySql}>
                  {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                  {copiedSql ? 'Đã chép' : 'Chép SQL'}
                </button>
              </div>
              <pre className="code-box">{SUPABASE_SQL_SETUP}</pre>
            </div>
          )}

          <div className="btn-row">
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Lưu cài đặt
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
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
