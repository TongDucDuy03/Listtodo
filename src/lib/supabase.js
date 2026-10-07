import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';
import { todayStr } from './date';

const STORAGE_KEYS = {
  SYNC_CODE: 'nhanhtodo_sync_code',
  LOCAL_TODOS: 'nhanhtodo_local_todos'
};

// URL và publishable key được gắn sẵn trong src/config.js,
// mỗi thiết bị chỉ cần nhớ mã danh sách (sync code).
export function getSavedConfig() {
  if (typeof window === 'undefined') return { url: SUPABASE_URL, key: SUPABASE_KEY, syncCode: '' };
  return {
    url: SUPABASE_URL,
    key: SUPABASE_KEY,
    syncCode: localStorage.getItem(STORAGE_KEYS.SYNC_CODE) || ''
  };
}

export function saveSyncCode(syncCode) {
  localStorage.setItem(STORAGE_KEYS.SYNC_CODE, syncCode.trim());
}

// Mã ngẫu nhiên dạng abcd-efgh-jkmn (bỏ các ký tự dễ nhầm như 0/o, 1/l/i)
export function generateSyncCode() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

// Link mở trên thiết bị khác sẽ tự lưu mã (phần #... không gửi lên server)
export function getShareLink(syncCode) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#sync=${encodeURIComponent(syncCode)}`;
}

export function readSyncCodeFromUrl() {
  const match = window.location.hash.match(/sync=([^&]+)/);
  if (!match) return '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return decodeURIComponent(match[1]).trim();
}

let supabaseInstance = null;
let currentConfigHash = '';

export function getSupabaseClient() {
  const { url, key, syncCode } = getSavedConfig();
  if (!url || !key || !syncCode) return null;

  const hash = `${url}_${key}_${syncCode}`;
  if (supabaseInstance && currentConfigHash === hash) {
    return supabaseInstance;
  }

  try {
    // Header x-sync-code được RLS kiểm tra: chỉ đọc/ghi được việc của đúng mã này
    supabaseInstance = createClient(url, key, {
      global: { headers: { 'x-sync-code': syncCode } },
      auth: { persistSession: false }
    });
    currentConfigHash = hash;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// Local Storage helpers
export function getLocalTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_TODOS);
    if (!raw) return getDefaultSampleTodos();
    return JSON.parse(raw);
  } catch {
    return getDefaultSampleTodos();
  }
}

export function saveLocalTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_TODOS, JSON.stringify(todos));
  } catch (e) {
    console.error('Failed to write local storage:', e);
  }
}

export function getDefaultSampleTodos() {
  const today = todayStr();
  return [
    {
      id: 'demo-1',
      text: 'Thử bấm micro rồi nói một việc cần làm',
      priority: 'urgent',
      due_date: today,
      completed: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      text: 'Cài app lên điện thoại (xem hướng dẫn trong Cài đặt)',
      priority: 'high',
      due_date: today,
      completed: false,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'demo-3',
      text: 'Đánh dấu xong việc này để gạch nó đi',
      priority: 'normal',
      due_date: today,
      completed: false,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];
}
