import React, { useCallback, useEffect, useState } from 'react';

const lifecycleLabels = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived'
};

const retentionLabels = {
  ACTIVE: ['Active', 'bg-emerald-50 text-emerald-700 border-emerald-100'],
  EXPIRING_SOON: ['Expiring Soon', 'bg-amber-50 text-amber-700 border-amber-100'],
  EXPIRED: ['Expired', 'bg-red-50 text-red-700 border-red-100']
};

const visibilityLabels = {
  PRIVATE: 'Private',
  INTERNAL: 'Internal',
  SHARED: 'Shared'
};

const approvalLabels = {
  NOT_SUBMITTED: 'Not Submitted',
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const formatSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const Documents = ({ onNavigate }) => {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [users, setUsers] = useState([]);
  const [shares, setShares] = useState([]);
  const [shareUserId, setShareUserId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionFile, setVersionFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    folder: '',
    status: 'ACTIVE',
    scope: '',
    approval: '',
    owner: '',
    reference: '',
    file_type: '',
    visibility: '',
    retention: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 10
  });

  const loadLookups = useCallback(() => {
    Promise.all([
      fetch('/api/categories', { credentials: 'include' }).then((response) => response.json()),
      fetch('/api/folders', { credentials: 'include' }).then((response) => response.json()),
      fetch('/api/users', { credentials: 'include' }).then((response) => response.json())
    ]).then(([categoryData, folderData, userData]) => {
      if (categoryData.success) setCategories(categoryData.data);
      if (folderData.success) setFolders(folderData.data);
      if (userData.success) setUsers(userData.data);
    }).catch((error) => console.error('Error fetching lookups:', error));
  }, []);

  const loadDocuments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit)
    });
    ['search', 'category', 'folder', 'status', 'scope', 'approval', 'owner', 'reference', 'file_type', 'visibility', 'retention', 'date_from', 'date_to'].forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });

    fetch(`/api/documents?${params.toString()}`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setDocuments(data.data);
          setTotalRecords(data.pagination.total);
        }
      })
      .catch((error) => console.error('Error fetching documents:', error))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(loadLookups, [loadLookups]);
  useEffect(loadDocuments, [loadDocuments]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', folder: '', status: 'ACTIVE', scope: '', approval: '', owner: '', reference: '', file_type: '', visibility: '', retention: '', date_from: '', date_to: '', page: 1, limit: 10 });
  };

  const loadShares = (documentId) => {
    fetch(`/api/documents/${documentId}/shares`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setShares(data.data);
      })
      .catch((error) => console.error('Error fetching shares:', error));
  };

  const openDetail = (document) => {
    setSelectedDocument(document);
    setVersionFile(null);
    setShareUserId('');
    setReviewerId('');
    setReviewComment('');
    setShares([]);
    setMessage('');
    fetch(`/api/documents/${document.id}/versions`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setVersions(data.data);
      })
      .catch((error) => console.error('Error fetching versions:', error));
    if (document.can_manage) loadShares(document.id);
  };

  const uploadVersion = async () => {
    if (!versionFile || !selectedDocument) return;
    const body = new FormData();
    body.append('file', versionFile);

    const response = await fetch(`/api/documents/${selectedDocument.id}/versions`, {
      method: 'POST',
      credentials: 'include',
      body
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to upload version');
      return;
    }

    setVersionFile(null);
    setMessage(`Version ${data.data.version_number} uploaded.`);
    loadDocuments();
    openDetail(selectedDocument);
  };

  const setLifecycle = async (document, action) => {
    const response = await fetch(`/api/documents?id=${document.id}&action=${action}`, {
      method: 'PATCH',
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to update document');
      return;
    }
    loadDocuments();
  };

  const setVisibility = async (visibility) => {
    if (!selectedDocument) return;
    const response = await fetch(`/api/documents?id=${selectedDocument.id}&action=visibility&visibility=${visibility}`, {
      method: 'PATCH',
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to update visibility');
      return;
    }
    const nextDocument = { ...selectedDocument, visibility };
    setSelectedDocument(nextDocument);
    loadDocuments();
  };

  const shareDocument = async () => {
    if (!selectedDocument || !shareUserId) return;
    const response = await fetch(`/api/documents/${selectedDocument.id}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: shareUserId })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to share document');
      return;
    }
    setMessage('Document shared.');
    setShareUserId('');
    setSelectedDocument({ ...selectedDocument, visibility: 'SHARED' });
    loadShares(selectedDocument.id);
    loadDocuments();
  };

  const revokeShare = async (userId) => {
    if (!selectedDocument) return;
    const response = await fetch(`/api/documents/${selectedDocument.id}/shares?user_id=${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to revoke access');
      return;
    }
    loadShares(selectedDocument.id);
  };

  const submitForReview = async () => {
    if (!selectedDocument || !reviewerId) return;
    const response = await fetch(`/api/documents/${selectedDocument.id}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reviewer_id: reviewerId, comment: reviewComment })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to submit review');
      return;
    }
    setMessage('Submitted for review.');
    setSelectedDocument({ ...selectedDocument, ...data.data });
    setReviewerId('');
    setReviewComment('');
    loadDocuments();
  };

  const decideReview = async (decision) => {
    if (!selectedDocument) return;
    const response = await fetch(`/api/documents/${selectedDocument.id}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ decision, comment: reviewComment })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Failed to review document');
      return;
    }
    setMessage(decision === 'approve' ? 'Document approved.' : 'Document rejected.');
    setSelectedDocument({ ...selectedDocument, ...data.data });
    setReviewComment('');
    loadDocuments();
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / filters.limit));
  const startIndex = totalRecords === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const endIndex = Math.min(filters.page * filters.limit, totalRecords);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Manage, organize, search, and maintain office documents.</p>
        </div>
        <button onClick={() => onNavigate('upload')} className="w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          + Upload Document
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search documents..." className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <select value={filters.folder} onChange={(e) => updateFilter('folder', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All folders</option>
            {folders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select value={filters.scope} onChange={(e) => updateFilter('scope', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All access</option>
            <option value="mine">My documents</option>
            <option value="shared-with-me">Shared with me</option>
            <option value="pending-review">Pending review</option>
          </select>
          <select value={filters.retention} onChange={(e) => updateFilter('retention', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All retention</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <button onClick={clearFilters} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <select value={filters.approval} onChange={(e) => updateFilter('approval', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All approval</option>
            <option value="NOT_SUBMITTED">Not Submitted</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={filters.visibility} onChange={(e) => updateFilter('visibility', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All visibility</option>
            <option value="PRIVATE">Private</option>
            <option value="INTERNAL">Internal</option>
            <option value="SHARED">Shared</option>
          </select>
          <input value={filters.owner} onChange={(e) => updateFilter('owner', e.target.value)} placeholder="Owner" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={filters.reference} onChange={(e) => updateFilter('reference', e.target.value)} placeholder="Number/ref" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={filters.file_type} onChange={(e) => updateFilter('file_type', e.target.value)} placeholder="PDF, DOCX..." className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Document Number', 'Category', 'Folder', 'Status', 'Approval', 'Access', 'Updated', 'Actions'].map((title) => (
                  <th key={title} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}><td colSpan="9" className="px-5 py-4"><div className="h-4 rounded bg-slate-100" /></td></tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center">
                    <p className="font-semibold text-slate-900">No documents found</p>
                    <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
                    <button onClick={clearFilters} className="mt-4 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Clear filters</button>
                  </td>
                </tr>
              ) : documents.map((item) => {
                const retention = retentionLabels[item.retention_status] || retentionLabels.ACTIVE;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <button onClick={() => openDetail(item)} className="text-left text-sm font-semibold text-slate-950 hover:text-blue-700">{item.title}</button>
                      <p className="mt-1 text-xs text-slate-500">{item.original_file_name || 'No file name'} - {formatSize(item.file_size)} - v{item.current_version || 1}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{item.document_number}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{item.category_name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{item.folder_name || '-'}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{lifecycleLabels[item.status] || item.status}</span>
                        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${retention[1]}`}>{retention[0]}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{approvalLabels[item.approval_status] || item.approval_status}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{visibilityLabels[item.visibility] || item.visibility}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{new Date(item.updated_at).toLocaleDateString('id-ID')}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <button onClick={() => openDetail(item)} className="mr-3 font-medium text-blue-600">View</button>
                      {item.can_manage && item.status === 'ARCHIVED' ? (
                        <button onClick={() => setLifecycle(item, 'restore')} className="font-medium text-emerald-600">Restore</button>
                      ) : item.can_manage ? (
                        <button onClick={() => setLifecycle(item, 'archive')} className="font-medium text-slate-600">Archive</button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {startIndex} to {endIndex} of {totalRecords} documents</p>
          <div className="flex gap-2">
            <button onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))} disabled={filters.page === 1} className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50">Prev</button>
            <span className="px-2 py-1.5">{filters.page} / {totalPages}</span>
            <button onClick={() => setFilters((current) => ({ ...current, page: Math.min(totalPages, current.page + 1) }))} disabled={filters.page === totalPages} className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
          <div className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{selectedDocument.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedDocument.document_number}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{lifecycleLabels[selectedDocument.status]}</span>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{selectedDocument.category_name}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={selectedDocument.preview_url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Preview</a>
                <a href={selectedDocument.download_url} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Download</a>
                <button onClick={() => setSelectedDocument(null)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Close</button>
              </div>
            </div>
            <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
              <iframe title={selectedDocument.title} src={selectedDocument.preview_url} className="h-[560px] w-full rounded-lg border border-slate-200 bg-slate-50" />
              <aside className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Metadata</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    {[
                      ['Category', selectedDocument.category_name],
                      ['Folder', selectedDocument.folder_name || '-'],
                      ['File', selectedDocument.original_file_name || '-'],
                      ['File Size', formatSize(selectedDocument.file_size)],
                      ['Current Version', `v${selectedDocument.current_version || 1}`],
                      ['Visibility', visibilityLabels[selectedDocument.visibility] || selectedDocument.visibility],
                      ['Approval', approvalLabels[selectedDocument.approval_status] || selectedDocument.approval_status],
                      ['Reviewer', selectedDocument.reviewer_username || '-'],
                      ['Retention Date', selectedDocument.retention_due_at?.slice(0, 10)],
                      ['Created By', selectedDocument.created_by_username || '-']
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="text-right font-medium text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                {selectedDocument.can_manage && (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sharing</h3>
                    {message && <p className="mt-2 text-sm text-blue-700">{message}</p>}
                    <select value={selectedDocument.visibility || 'INTERNAL'} onChange={(e) => setVisibility(e.target.value)} className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                      <option value="PRIVATE">Private</option>
                      <option value="INTERNAL">Internal</option>
                      <option value="SHARED">Shared</option>
                    </select>
                    <div className="mt-3 flex gap-2">
                      <select value={shareUserId} onChange={(e) => setShareUserId(e.target.value)} className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select user</option>
                        {users.filter((user) => !shares.some((share) => share.user_id === user.id)).map((user) => (
                          <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                      </select>
                      <button onClick={shareDocument} disabled={!shareUserId} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Share</button>
                    </div>
                    <div className="mt-3 divide-y divide-slate-100">
                      {shares.length === 0 ? (
                        <p className="py-2 text-sm text-slate-500">No specific users shared yet.</p>
                      ) : shares.map((share) => (
                        <div key={share.user_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="font-medium text-slate-800">{share.username}</span>
                          <button onClick={() => revokeShare(share.user_id)} className="text-red-600">Revoke</button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {(selectedDocument.can_manage || selectedDocument.can_review) && (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Approval</h3>
                    <p className="mt-2 text-sm font-medium text-slate-800">{approvalLabels[selectedDocument.approval_status] || selectedDocument.approval_status}</p>
                    {selectedDocument.review_comment && <p className="mt-1 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{selectedDocument.review_comment}</p>}
                    {selectedDocument.can_manage && (
                      <div className="mt-3 space-y-3">
                        <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                          <option value="">Select reviewer</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                          ))}
                        </select>
                        <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="3" placeholder="Review note" className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        <button onClick={submitForReview} disabled={!reviewerId} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Submit for Review</button>
                      </div>
                    )}
                    {selectedDocument.can_review && (
                      <div className="mt-3 space-y-3">
                        <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="3" placeholder="Reason or comment" className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => decideReview('approve')} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white">Approve</button>
                          <button onClick={() => decideReview('reject')} className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">Reject</button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
                {selectedDocument.can_manage && (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upload New Version</h3>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setVersionFile(e.target.files[0] || null)} className="mt-3 w-full text-sm" />
                    <button onClick={uploadVersion} disabled={!versionFile} className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Upload Version</button>
                  </section>
                )}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Versions</h3>
                  <div className="mt-3 divide-y divide-slate-100">
                    {versions.map((version) => (
                      <div key={version.id} className="py-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">v{version.version_number}</p>
                          {version.is_current && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Current</span>}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{version.original_file_name || '-'} - {formatSize(version.file_size)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
