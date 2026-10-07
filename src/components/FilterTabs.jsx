import React from 'react';
import { Search } from 'lucide-react';

const TABS = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'urgent', label: 'Gấp' },
  { id: 'all', label: 'Tất cả' },
  { id: 'completed', label: 'Đã xong' }
];

export default function FilterTabs({
  activeFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  counts
}) {
  return (
    <div className="filter-bar">
      <div className="filter-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`filter-${tab.id}-btn`}
            role="tab"
            aria-selected={activeFilter === tab.id}
            className={`tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => onSelectFilter(tab.id)}
          >
            {tab.label}
            <span className="tab-count">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <label className="search-field">
        <Search size={14} />
        <input
          type="search"
          placeholder="Tìm việc hoặc #nhãn"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Tìm việc"
        />
      </label>
    </div>
  );
}
