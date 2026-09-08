import React from 'react';
import { navigation } from '../config/navigation';

const icons = {
  dashboard: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
  documents: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2.5L17.5 8H14V4.5ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Z',
  upload: 'M12 3 7 8h3v6h4V8h3l-5-5ZM5 19h14v2H5v-2Z',
  folders: 'M10 4 12 6h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6Z',
  categories: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  activity: 'M3 12h4l3-7 4 14 3-7h4',
  reports: 'M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4a7.5 7.5 0 0 1-.2 1.7l2 1.5-2 3.5-2.4-1a7.6 7.6 0 0 1-2.9 1.7L15 22h-4l-.5-2.6a7.6 7.6 0 0 1-2.9-1.7l-2.4 1-2-3.5 2-1.5A7.5 7.5 0 0 1 5 12c0-.6.1-1.2.2-1.7l-2-1.5 2-3.5 2.4 1a7.6 7.6 0 0 1 2.9-1.7L11 2h4l.5 2.6a7.6 7.6 0 0 1 2.9 1.7l2.4-1 2 3.5-2 1.5c.1.5.2 1.1.2 1.7Z'
};

const Sidebar = ({ onPageChange, currentPage }) => (
  <aside className="app-sidebar flex h-screen w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
    <div className="border-b border-gray-100 p-6">
      <div className="flex items-center gap-3">
        <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-lg shadow-sm">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={icons.documents} />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-blue-600">Document</p>
          <h1 className="text-xl font-bold text-gray-950">DMS Office</h1>
        </div>
      </div>
    </div>

    <nav className="flex-1 space-y-2 p-4">
      {navigation.map((item) => (
        <button
          key={item.key}
          onClick={() => onPageChange(item.key)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
            currentPage === item.key
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
          }`}
        >
          <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={icons[item.key]} />
          </svg>
          {item.label}
        </button>
      ))}
    </nav>

    <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">Workspace</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">Office Archive</p>
      <p className="mt-1 text-xs text-slate-500">Organized document records</p>
    </div>
  </aside>
);

export default Sidebar;
