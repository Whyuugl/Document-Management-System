import React from 'react';

const colors = ['bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-violet-500', 'bg-red-500', 'bg-emerald-500'];

const Chart = ({ categories = [] }) => {
  const maxValue = Math.max(1, ...categories.map((item) => item.count || 0));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Distribution</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Documents by Category</h3>
        </div>
        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{categories.length} groups</span>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No category data yet</div>
        ) : categories.map((item, index) => (
          <div key={item.slug}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                {item.name}
              </span>
              <span className="text-slate-500">{item.count || 0}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${colors[index % colors.length]}`}
                style={{ width: `${((item.count || 0) / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chart;
