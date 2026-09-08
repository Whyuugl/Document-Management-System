import React, { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  documentNumber: '',
  category: '',
  folderId: '',
  status: 'ACTIVE',
  visibility: 'INTERNAL',
  ownerName: '',
  referenceNumber: '',
  date: '',
  description: ''
};

const UploadDocument = ({ onNavigate }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories', { credentials: 'include' }).then((response) => response.json()),
      fetch('/api/folders', { credentials: 'include' }).then((response) => response.json())
    ]).then(([categoryData, folderData]) => {
      if (categoryData.success) {
        setCategories(categoryData.data);
        setFormData((current) => ({ ...current, category: current.category || categoryData.data[0]?.slug || '' }));
      }
      if (folderData.success) setFolders(folderData.data);
    }).catch((error) => console.error('Error fetching upload lookups:', error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setFile(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please choose a document file.');
      return;
    }

    setLoading(true);
    setMessage('Uploading document...');

    const body = new FormData();
    body.append('category', formData.category);
    body.append('folder_id', formData.folderId);
    body.append('status', formData.status);
    body.append('visibility', formData.visibility);
    body.append('title', formData.title);
    body.append('document_number', formData.documentNumber);
    body.append('owner_name', formData.ownerName);
    body.append('reference_number', formData.referenceNumber || formData.documentNumber);
    body.append('document_date', formData.date || new Date().toISOString().slice(0, 10));
    body.append('description', formData.description);
    body.append('file', file);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body,
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || 'Upload failed.');
        return;
      }

      setMessage('Document uploaded.');
      resetForm();
      onNavigate('documents');
    } catch (error) {
      setMessage(error.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Upload Document</h1>
        <p className="mt-1 text-sm text-slate-500">Add a file and the minimum metadata needed to organize it.</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {message && (
          <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold text-slate-900">File</h2>
          <label className="mt-4 block rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-400">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files[0] || null)} className="hidden" />
            <span className="block text-sm font-medium text-gray-700">{file ? file.name : 'Choose PDF, image, or Word document'}</span>
            <span className="mt-1 block text-xs text-gray-500">{file ? `${file.type || 'Unknown type'} - ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Maximum 10MB'}</span>
          </label>
        </section>

        <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Document Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input name="title" value={formData.title} onChange={handleChange} required className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Document Number</span>
            <input name="documentNumber" value={formData.documentNumber} onChange={handleChange} required className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select name="category" value={formData.category} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Folder</span>
            <select name="folderId" value={formData.folderId} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">General Archive</option>
              {folders.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" value={formData.status} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Visibility</span>
            <select name="visibility" value={formData.visibility} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="PRIVATE">Private</option>
              <option value="INTERNAL">Internal</option>
              <option value="SHARED">Shared</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Document Date</span>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Owner / Related Name</span>
            <input name="ownerName" value={formData.ownerName} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Reference Number</span>
            <input name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => onNavigate('documents')} className="rounded-md bg-slate-100 px-5 py-2 font-medium text-slate-700 hover:bg-slate-200">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadDocument;
