import React from 'react';

const StatCard = ({ title, value, icon, color = "blue", note = "Tersimpan" }) => {
  const colorClasses = {
    blue: "text-blue-700",
    green: "text-emerald-700",
    yellow: "text-amber-700",
    red: "text-red-700",
    purple: "text-violet-700",
    custom: "text-slate-700"
  };

  return (
    <div className="metric-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="metric-card-line" />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`metric-icon flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
