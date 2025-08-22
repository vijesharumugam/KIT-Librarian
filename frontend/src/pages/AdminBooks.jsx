import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PAGE_SIZE = 10;

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('http://localhost:5000/api/books');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch books');
        setBooks(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
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
                      </tr>
                    ))}
                    {filteredBooks.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No books found.</td>
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
    </div>
  );
};

export default AdminBooks;
