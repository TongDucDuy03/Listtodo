import React from 'react';
import { Settings, Sun, Moon, Download } from 'lucide-react';
import StatsBar from './StatsBar';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

export default function Header({
  todos,
  isCloudConnected,
  syncCode,
  theme,
  onToggleTheme,
  onOpenSettings,
  deferredInstallPrompt,
  onInstallPwa
}) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand">
          <h1>NhanhTodo</h1>
          <span
            className={`sync-status ${isCloudConnected ? 'cloud' : 'local'}`}
            title={
              isCloudConnected
                ? 'Danh sách đã được lưu lên mạng và dùng chung trên các thiết bị'
                : `Không kết nối được máy chủ. Việc mới vẫn lưu trên máy này (mã ${syncCode}).`
            }
          >
            {isCloudConnected ? 'Đã đồng bộ' : 'Chưa đồng bộ'}
          </span>
        </div>

        <div className="header-actions">
          {deferredInstallPrompt && (
            <button
              id="install-pwa-btn"
              className="icon-btn"
              onClick={onInstallPwa}
              title="Cài app lên máy"
              aria-label="Cài app lên máy"
            >
              <Download size={18} />
            </button>
          )}

          <button
            id="theme-toggle-btn"
            className="icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            aria-label="Đổi giao diện sáng/tối"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            id="open-settings-btn"
            className="icon-btn"
            onClick={onOpenSettings}
            title="Cài đặt"
            aria-label="Cài đặt"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <h2 className="today-heading">{dateFormatter.format(new Date())}</h2>
      <StatsBar todos={todos} />
    </header>
  );
}
