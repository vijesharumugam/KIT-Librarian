import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PAGE_SIZE = 10;

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ _id: '', title: '', author: '', totalQuantity: 1 });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/books');
      setBooks(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchBooks();
  }, []);

  // Edit handlers
  const startEdit = (book) => {
    setEditForm({
      _id: book._id,
      title: book.title || '',
      author: book.author || '',
      totalQuantity: Number(book.totalQuantity) || 1,
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditForm({ _id: '', title: '', author: '', totalQuantity: 1 });
  };

  const saveEdit = async () => {
    if (!editForm._id) return;
    const title = editForm.title.trim();
    const author = editForm.author.trim();
    const qtyNum = parseInt(editForm.totalQuantity, 10);
    if (!title || !author || Number.isNaN(qtyNum) || qtyNum <= 0) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      await api.put(
        `/api/books/${editForm._id}`,
        { title, author, totalQuantity: qtyNum },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setToast('Book updated');
      setShowEditModal(false);
      setEditForm({ _id: '', title: '', author: '', totalQuantity: 1 });
      await fetchBooks();
      setTimeout(() => setToast(''), 1000);
    } catch (e) {
      setError(e.message || 'Something went wrong while updating');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter books locally by title or author (case-insensitive)
  const normalized = searchTerm.trim().toLowerCase();
  const filteredBooks = normalized
    ? books.filter((b) =>
        (b.title || '').toLowerCase().includes(normalized) ||
        (b.author || '').toLowerCase().includes(normalized)
      )
    : books;

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = filteredBooks.slice(startIdx, startIdx + PAGE_SIZE);

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Books</h1>
              <p className="text-gray-600">All books in the library</p>
            </div>
            <Link to="/admin/dashboard" className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
          )}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">Loading...</div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Search bar */}
              <div className="flex items-center justify-end mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // reset to first page on new search
                  }}
                  placeholder="Search by title or author..."
                  className="w-full sm:w-80 md:w-96 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th colSpan={6} className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(true)}
                          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Add Book
                        </button>
                      </th>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pageItems.map((b) => (
                      <tr key={b._id}>
                        <td className="px-4 py-2 whitespace-nowrap">{b.title}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.author}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.totalQuantity ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.issuedCount ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{(b.totalQuantity ?? 0) - (b.issuedCount ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(b)}
                            className="p-1 rounded text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <span role="img" aria-hidden="true">✏️</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredBooks.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No books found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBooks.length > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => goTo(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => goTo(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddModal(false)}
          />
          {/* Modal content */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Book</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter author"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <input
                  type="text"
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter ISBN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={submitting}
                onClick={async () => {
                  // Validate
                  const title = form.title.trim();
                  const author = form.author.trim();
                  const isbn = form.isbn.trim();
                  const quantityNum = Number(form.quantity);
                  if (!title || !author || !isbn || Number.isNaN(quantityNum) || quantityNum < 0) {
                    alert('Please fill all fields correctly.');
                    return;
                  }
                  try {
                    setSubmitting(true);
                    const token = localStorage.getItem('adminToken');
                    await api.post(
                      '/api/books',
                      { title, author, isbn, totalQuantity: quantityNum },
                      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                    );
                    setToast('Book added successfully');
                    setShowAddModal(false);
                    setForm({ title: '', author: '', isbn: '', quantity: '' });
                    await fetchBooks();
                    setTimeout(() => setToast(''), 1000);
                  } catch (e) {
                    alert(e.message || 'Something went wrong');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Book Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={cancelEdit} />
          {/* Modal content */}
          <div
            className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
              }
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Book</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={editForm.author}
                  onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter author"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.totalQuantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, totalQuantity: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter quantity"
                />
                {(!editForm.totalQuantity || parseInt(editForm.totalQuantity, 10) <= 0) && (
                  <p className="mt-1 text-xs text-red-600">Quantity must be a positive integer</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50"
                onClick={cancelEdit}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                onClick={saveEdit}
                disabled={(() => { const t=editForm.title.trim(); const a=editForm.author.trim(); const q=parseInt(editForm.totalQuantity,10); return submitting || !t || !a || Number.isNaN(q) || q<=0; })()}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="bg-emerald-600 text-white text-sm px-4 py-2 rounded shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBooks;
