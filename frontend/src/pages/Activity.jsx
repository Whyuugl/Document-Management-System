import React, { useEffect, useState } from 'react';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setActivities(data.data);
      })
      .catch((error) => console.error('Error fetching activity:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">Recent document activity</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ['all', 'All'],
            ['document', 'Documents'],
            ['folder', 'Folders'],
            ['category', 'Categories']
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === key ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : activities.filter((item) => filter === 'all' || item.entity_type === filter).length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-8 text-center">
            <p className="font-semibold text-slate-900">No activity yet</p>
            <p className="mt-1 text-sm text-slate-500">New document, folder, and category actions will appear here.</p>
          </div>
        ) : (
          <div className="relative space-y-1">
            {activities.filter((item) => filter === 'all' || item.entity_type === filter).map((item) => (
              <div key={item.id} className="grid grid-cols-[16px_1fr] gap-3 py-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                <div>
                  <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-950">{item.message}</p>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item.action.replaceAll('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.created_by_username || 'System'} - {new Date(item.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
