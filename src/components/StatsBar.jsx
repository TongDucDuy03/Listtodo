import React from 'react';
import { todayStr } from '../lib/date';

export default function StatsBar({ todos }) {
  const today = todayStr();

  // Tasks for today or tasks marked urgent
  const todayTasks = todos.filter((t) => t.due_date === today || (!t.due_date && !t.completed));
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const percent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 100;

  if (totalToday === 0) {
    return <div className="today-progress">Hôm nay chưa có việc nào.</div>;
  }

  return (
    <div className="today-progress">
      <span>
        {completedToday === totalToday ? (
          <>Xong hết <strong>{totalToday}</strong> việc hôm nay</>
        ) : (
          <>Đã xong <strong>{completedToday}/{totalToday}</strong> việc hôm nay</>
        )}
      </span>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
