import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import QuickInput from './components/QuickInput';
import FilterTabs from './components/FilterTabs';
import TodoItem from './components/TodoItem';
import SettingsModal from './components/SettingsModal';
import {
  getSupabaseClient,
  getSavedConfig,
  getLocalTodos,
  saveLocalTodos
} from './lib/supabase';
import { sendLocalNotification } from './lib/notifications';
import { playAlertSound } from './lib/sound';

export default function App() {
  const [todos, setTodos] = useState(() => getLocalTodos());
  const [activeFilter, setActiveFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nhanhtodo_theme') || 'light';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [config, setConfig] = useState(() => getSavedConfig());

  // Set document theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nhanhtodo_theme', theme);
  }, [theme]);

  // Handle PWA installation prompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  // Sync with Supabase if configured
  const loadSupabaseTodos = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsCloudConnected(false);
      return;
    }

    try {
      const { data, error } = await client
        .from('todos')
        .select('*')
        .eq('sync_code', config.syncCode)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error);
        setIsCloudConnected(false);
      } else if (data) {
        setTodos(data);
        saveLocalTodos(data);
        setIsCloudConnected(true);
      }
    } catch (err) {
      console.warn('Supabase connection failed:', err);
      setIsCloudConnected(false);
    }
  }, [config.syncCode]);

  useEffect(() => {
    loadSupabaseTodos();

    const client = getSupabaseClient();
    if (!client) return;

    // Realtime subscription for cross-device live updates
    const channel = client
      .channel('todos-sync-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `sync_code=eq.${config.syncCode}` },
        () => {
          loadSupabaseTodos();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [config, loadSupabaseTodos]);

  // Save to LocalStorage whenever todos change
  useEffect(() => {
    saveLocalTodos(todos);
  }, [todos]);

  // Anti-forgetting background reminder check (every 5 minutes)
  useEffect(() => {
    const checkReminders = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const urgentPending = todos.filter(
        (t) => !t.completed && (t.priority === 'urgent' || t.due_date === todayStr)
      );

      if (urgentPending.length > 0) {
        sendLocalNotification('NhanhTodo: Nhắc việc cần làm hôm nay', {
          body: `Bạn có ${urgentPending.length} việc cần giải quyết hôm nay. Bấm để xem!`,
          tag: 'nhanhtodo-reminder'
        });
      }
    };

    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [todos]);

  // Add Task
  const handleAddTask = async (newTaskData) => {
    const newTodo = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sync_code: config.syncCode,
      text: newTaskData.text,
      priority: newTaskData.priority || 'normal',
      due_date: newTaskData.due_date || new Date().toISOString().split('T')[0],
      tags: newTaskData.tags || [],
      completed: false,
      created_at: new Date().toISOString()
    };

    // Optimistic UI update
    setTodos((prev) => [newTodo, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('todos').insert([newTodo]);
      } catch (e) {
        console.error('Failed to sync insert to Supabase:', e);
      }
    }
  };

  // Toggle Complete
  const handleToggleComplete = async (id, completed) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null } : t
    );
    setTodos(updated);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from('todos')
          .update({ completed, completed_at: completed ? new Date().toISOString() : null })
          .eq('id', id);
      } catch (e) {
        console.error('Failed to sync complete to Supabase:', e);
      }
    }
  };

  // Delete Task
  const handleDelete = async (id) => {
    const nextTodos = todos.filter((t) => t.id !== id);
    setTodos(nextTodos);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('todos').delete().eq('id', id);
      } catch (e) {
        console.error('Failed to sync delete to Supabase:', e);
      }
    }
  };

  // Update Task Text
  const handleUpdateText = async (id, text) => {
    const nextTodos = todos.map((t) => (t.id === id ? { ...t, text } : t));
    setTodos(nextTodos);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('todos').update({ text }).eq('id', id);
      } catch (e) {
        console.error('Failed to sync edit to Supabase:', e);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      today: todos.filter((t) => !t.completed && (t.due_date === todayStr || !t.due_date)).length,
      urgent: todos.filter((t) => !t.completed && t.priority === 'urgent').length,
      all: todos.filter((t) => !t.completed).length,
      completed: todos.filter((t) => t.completed).length
    };
  }, [todos, todayStr]);

  // Filtered todos based on active tab & search query
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = todo.text.toLowerCase().includes(query);
        const matchesTag = Array.isArray(todo.tags) && todo.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesText && !matchesTag) return false;
      }

      // Tab filter
      if (activeFilter === 'today') {
        return !todo.completed && (todo.due_date === todayStr || !todo.due_date);
      }
      if (activeFilter === 'urgent') {
        return !todo.completed && todo.priority === 'urgent';
      }
      if (activeFilter === 'completed') {
        return todo.completed;
      }
      // 'all' tab shows all uncompleted tasks
      return !todo.completed;
    });
  }, [todos, activeFilter, searchQuery, todayStr]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleConfigSaved = (newConfig) => {
    setConfig(newConfig);
    loadSupabaseTodos();
  };

  const emptyCopy = {
    today: ['Hôm nay trống trơn.', 'Ghi việc mới ở dòng trên, hoặc bấm micro để nói.'],
    urgent: ['Không có việc gấp.', 'Thêm !gap vào cuối câu để đánh dấu việc gấp.'],
    all: ['Chưa có việc nào.', 'Ghi việc mới ở dòng trên, hoặc bấm micro để nói.'],
    completed: ['Chưa xong việc nào.', 'Đánh dấu một việc là xong, nó sẽ hiện ở đây.']
  };
  const [emptyTitle, emptyDesc] = searchQuery.trim()
    ? [`Không tìm thấy "${searchQuery.trim()}".`, 'Thử từ khóa khác hoặc xem tab Tất cả.']
    : emptyCopy[activeFilter];

  return (
    <div className="app-container">
      <Header
        todos={todos}
        isCloudConnected={isCloudConnected}
        syncCode={config.syncCode}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
      />

      <FilterTabs
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      <main className="sheet">
        <QuickInput onAddTask={handleAddTask} />

        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onUpdateText={handleUpdateText}
            />
          ))
        ) : (
          <div className="empty-state">
            <p className="empty-title">{emptyTitle}</p>
            <p className="empty-desc">{emptyDesc}</p>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={handleConfigSaved}
        todos={todos}
        onImportTodos={(imported) => setTodos(imported)}
      />
    </div>
  );
}
