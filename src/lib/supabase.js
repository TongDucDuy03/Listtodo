import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'nhanhtodo_supabase_url',
  SUPABASE_KEY: 'nhanhtodo_supabase_key',
  SYNC_CODE: 'nhanhtodo_sync_code',
  LOCAL_TODOS: 'nhanhtodo_local_todos'
};

// Get stored configurations
export function getSavedConfig() {
  if (typeof window === 'undefined') return { url: '', key: '', syncCode: 'my-todo' };
  return {
    url: localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '',
    key: localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || '',
    syncCode: localStorage.getItem(STORAGE_KEYS.SYNC_CODE) || 'my-todo'
  };
}

export function saveConfig({ url, key, syncCode }) {
  if (typeof window === 'undefined') return;
  if (url !== undefined) localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  if (key !== undefined) localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key.trim());
  if (syncCode !== undefined) localStorage.setItem(STORAGE_KEYS.SYNC_CODE, syncCode.trim() || 'my-todo');
}

let supabaseInstance = null;
let currentConfigHash = '';

export function getSupabaseClient() {
  const { url, key } = getSavedConfig();
  if (!url || !key) return null;

  const hash = `${url}_${key}`;
  if (supabaseInstance && currentConfigHash === hash) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key);
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
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'demo-1',
      text: 'Thử bấm micro rồi nói một việc cần làm',
      priority: 'urgent',
      due_date: todayStr,
      completed: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      text: 'Cài app lên điện thoại (xem hướng dẫn trong Cài đặt)',
      priority: 'high',
      due_date: todayStr,
      completed: false,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'demo-3',
      text: 'Đánh dấu xong việc này để gạch nó đi',
      priority: 'normal',
      due_date: todayStr,
      completed: false,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];
}

export const SUPABASE_SQL_SETUP = `-- Copy và chạy đoạn mã này trong SQL Editor của Supabase:
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  sync_code TEXT NOT NULL DEFAULT 'my-todo',
  text TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  due_date TEXT,
  reminder_time TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bật phân quyền truy cập
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON todos;
CREATE POLICY "Public access" ON todos FOR ALL USING (true) WITH CHECK (true);

-- Bật tính năng đồng bộ thời gian thực Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
`;
