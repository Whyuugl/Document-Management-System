import React, { useEffect, useMemo, useState } from 'react';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch((error) => console.error('Error fetching reports:', error))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!stats) return [];
    return (stats.categories || []).map((category) => ({
      jenis: category.name,
      jumlah: category.count || 0,
      status: 'Tersimpan'
    }));
  }, [stats]);

  const exportCsv = () => {
    const csv = ['Category,Documents,Status', ...rows.map((row) => `${row.jenis},${row.jumlah},${row.status}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Document totals, monthly uploads, and retention status</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ['Total Documents', stats?.totalDocuments || 0, 'text-gray-900'],
            ['Created This Month', stats?.documentsThisMonth || 0, 'text-blue-600'],
            ['Due in 90 Days', stats?.retensiSegera || 0, 'text-amber-600'],
            ['Needs Review', stats?.retensiReview || 0, 'text-red-600']
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${color}`}>{loading ? '...' : value}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button onClick={exportCsv} className="rounded-lg bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700">
              Export CSV
            </button>
            <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700">
              Print
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">Documents by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Category', 'Documents', 'Status'].map((title) => (
                    <th key={title} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.map((item, index) => (
                  <tr key={item.jenis} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{item.jenis}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{loading ? '...' : item.jumlah}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
