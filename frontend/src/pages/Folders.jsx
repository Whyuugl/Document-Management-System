import React, { useEffect, useState } from 'react';

const emptyForm = { name: '', description: '', parent_id: '' };

const Folders = () => {
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadFolders = () => {
    setLoading(true);
    fetch('/api/folders', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setFolders(data.data);
      })
      .catch((error) => console.error('Error fetching folders:', error))
      .finally(() => setLoading(false));
  };

  useEffect(loadFolders, []);

  const saveFolder = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/folders${editingId ? `?id=${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, parent_id: form.parent_id || null })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to save folder');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setMessage('Folder saved.');
    loadFolders();
  };

  const editFolder = (folder) => {
    setEditingId(folder.id);
    setForm({ name: folder.name, description: folder.description || '', parent_id: folder.parent_id || '' });
  };

  const deleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder ${folder.name}?`)) return;
    const response = await fetch(`/api/folders?id=${folder.id}`, { method: 'DELETE', credentials: 'include' });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to delete folder');
      return;
    }
    loadFolders();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Folders</h1>
        <p className="mt-1 text-sm text-slate-500">Organize documents into office folders</p>
      </div>

      <form onSubmit={saveFolder} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {message && <p className="mb-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>}
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto]">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Folder name" required className="rounded-md border border-gray-300 px-3 py-2" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-md border border-gray-300 px-3 py-2" />
          <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
            <option value="">Root folder</option>
            {folders.filter((folder) => folder.id !== editingId).map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
          <button className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">{editingId ? 'Update' : 'Add'}</button>
        </div>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : folders.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No folders yet</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {folders.map((folder) => (
              <div key={folder.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{folder.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{folder.description || 'No description'}</p>
                    <p className="mt-3 text-xs text-slate-500">{folder.parent_name ? `Inside ${folder.parent_name}` : 'Root folder'} - {folder.document_count} documents</p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => editFolder(folder)} className="font-medium text-blue-600">Edit</button>
                    <button onClick={() => deleteFolder(folder)} className="font-medium text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Folders;
