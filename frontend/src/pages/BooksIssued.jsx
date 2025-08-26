import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BooksIssued = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Confirm modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingReturnId, setPendingReturnId] = useState(null);
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  const fetchIssued = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const { data } = await api.get('/api/transactions/issued', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssued(); }, []);

  const filtered = items.filter((it) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const title = it.book?.title?.toLowerCase() || '';
    const reg = it.student?.registerNumber?.toLowerCase() || '';
    return title.includes(term) || reg.includes(term);
  });

  const returnTx = async (id) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      await api.put(`/api/transactions/return/${id}`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // Refresh list
      await fetchIssued();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Toast helpers
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  // Click handlers
  const onClickReturn = (id) => {
    setPendingReturnId(id);
    setShowConfirm(true);
  };

  const onConfirmReturn = async () => {
    const id = pendingReturnId;
    setShowConfirm(false);
    setPendingReturnId(null);
    await returnTx(id);
    showToast('Book marked as returned', 'success');
  };

  const onCancelReturn = () => {
    setShowConfirm(false);
    setPendingReturnId(null);
    showToast('Book not marked as returned', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Books Issued</h1>
              <p className="text-gray-600">Currently borrowed books</p>
            </div>
            <Link to="/admin/dashboard" className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-end mb-4 gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by book title or register no"
              className="border border-gray-300 rounded-md px-3 py-2 w-80"
            />
            <span className="text-sm text-gray-500">{filtered.length} results</span>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
          )}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">Loading...</div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Register No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((it) => (
                      <tr key={it._id}>
                        <td className="px-4 py-2 whitespace-nowrap">{it.book?.title || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{it.student?.registerNumber || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{it.student?.name || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => onClickReturn(it._id)}
                            className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            disabled={loading}
                          >
                            Return
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No issued books.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    {/* Toast */}
    {toast.show && (
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`px-4 py-2 rounded shadow text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'
          }`}
        >
          {toast.message}
        </div>
      </div>
    )}

    {/* Confirm Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onCancelReturn}></div>
        <div className="relative z-50 w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Confirm</h3>
          </div>
          <div className="px-6 py-5">
            <p className="text-gray-700">Do you want to return this book?</p>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button onClick={onCancelReturn} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={onConfirmReturn} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">OK</button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default BooksIssued;
