import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import Chart from '../components/Chart';

const icon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2.5L17.5 8H14V4.5ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Z" />
  </svg>
);

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    categories: [],
    documentsThisMonth: 0,
    retensiReview: 0,
    retensiSegera: 0,
    retensiAktif: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch((error) => console.error('Error fetching dashboard stats:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="dashboard-intro rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-700">Document Control Center</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Office document overview with retention signals, category distribution, and quick access to daily archive work.</p>
          </div>
          <button onClick={() => onNavigate('documents')} className="w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Open Documents
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Documents" value={loading ? '...' : stats.totalDocuments} icon={icon} color="blue" note="Stored records" />
        <StatCard title="Created This Month" value={loading ? '...' : stats.documentsThisMonth} icon={icon} color="green" note="New documents" />
        <StatCard title="Due in 90 Days" value={loading ? '...' : stats.retensiSegera} icon={icon} color="yellow" note="Prepare review" />
        <StatCard title="Needs Review" value={loading ? '...' : stats.retensiReview} icon={icon} color="red" note="Retention due" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Chart categories={stats.categories} />
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            <div className="mt-5 grid gap-3">
              <button onClick={() => onNavigate('upload')} className="rounded-lg bg-blue-600 px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-blue-700">
                + Upload Document
              </button>
              <button onClick={() => onNavigate('folders')} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Create Folder
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Retention Summary</h3>
            <div className="mt-5 space-y-4">
              {[
                ['Active', stats.retensiAktif, 'text-emerald-600'],
                ['Due Soon', stats.retensiSegera, 'text-amber-600'],
                ['Needs Review', stats.retensiReview, 'text-red-600']
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                  <span className={`text-lg font-bold ${color}`}>{loading ? '...' : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
