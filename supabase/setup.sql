-- Chạy một lần trong Supabase > SQL Editor. Chạy lại nhiều lần cũng không sao.

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  sync_code TEXT NOT NULL,
  text TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  due_date TEXT,
  tags TEXT[] DEFAULT '{}',
  reminder_time TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nếu bảng đã được tạo từ bản SQL cũ (thiếu cột tags)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS todos_sync_code_idx ON todos (sync_code);

-- Chỉ đọc/ghi được những việc có sync_code trùng với header x-sync-code app gửi lên.
-- Publishable key công khai cũng không liệt kê được danh sách của người khác.
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON todos;
DROP POLICY IF EXISTS "Own sync code" ON todos;
CREATE POLICY "Own sync code" ON todos
  FOR ALL
  USING (sync_code = current_setting('request.headers', true)::json->>'x-sync-code')
  WITH CHECK (sync_code = current_setting('request.headers', true)::json->>'x-sync-code');
