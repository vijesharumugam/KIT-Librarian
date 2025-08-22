import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const BooksIssued = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      const res = await fetch('http://localhost:5000/api/transactions/issued', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch issued books');
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
    const confirm = window.confirm('Mark this book as returned?');
    if (!confirm) return;
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/transactions/return/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to return book');
      // Refresh list
      await fetchIssued();
      // Optional toast
      if (window?.alert) window.alert('Book returned successfully');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((it) => (
                      <tr key={it._id}>
                        <td className="px-4 py-2 whitespace-nowrap">{it.book?.title || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{it.student?.registerNumber || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => returnTx(it._id)}
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
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No issued books.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BooksIssued;
