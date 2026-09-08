import React, { useEffect, useState } from 'react';

const emptyForm = { name: '', description: '', retention_years: 3 };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadCategories = () => {
    setLoading(true);
    fetch('/api/categories', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch((error) => console.error('Error fetching categories:', error))
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const saveCategory = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/categories${editingId ? `?id=${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to save category');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setMessage('Category saved.');
    loadCategories();
  };

  const editCategory = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description || '', retention_years: item.retention_years });
  };

  const deleteCategory = async (item) => {
    if (!window.confirm(`Delete category ${item.name}?`)) return;
    const response = await fetch(`/api/categories?id=${item.id}`, { method: 'DELETE', credentials: 'include' });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to delete category');
      return;
    }
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">Classify documents with retention rules</p>
      </div>

      <form onSubmit={saveCategory} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {message && <p className="mb-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>}
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px_auto]">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" required className="rounded-md border border-gray-300 px-3 py-2" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-md border border-gray-300 px-3 py-2" />
          <input type="number" min="1" value={form.retention_years} onChange={(e) => setForm({ ...form, retention_years: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
          <button className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">{editingId ? 'Update' : 'Add'}</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Slug', 'Retention', 'Documents', 'Description', 'Actions'].map((title) => (
                <th key={title} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : categories.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.slug}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.retention_years} years</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.document_count}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <button onClick={() => editCategory(item)} className="mr-3 font-medium text-blue-600">Edit</button>
                  <button onClick={() => deleteCategory(item)} className="font-medium text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;
