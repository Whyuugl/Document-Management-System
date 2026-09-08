import React from 'react';

const Settings = () => (
  <div className="mx-auto max-w-4xl space-y-8">
    <div>
      <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">System defaults currently configured in the application.</p>
    </div>

    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Document Handling</h2>
      <div className="mt-5 divide-y divide-slate-100">
        {[
          ['Storage', 'Local protected upload storage'],
          ['Maximum file size', '10 MB'],
          ['Accepted preview formats', 'PDF, JPG, PNG'],
          ['Accepted upload formats', 'PDF, JPG, PNG, DOC, DOCX'],
          ['Retention policy', 'Configured per category']
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">{label}</p>
            </div>
            <p className="text-sm text-slate-500">{value}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default Settings;
