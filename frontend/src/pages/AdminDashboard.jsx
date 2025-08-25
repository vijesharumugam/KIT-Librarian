import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [issuedBooks, setIssuedBooks] = useState(0);
  const [overdueBooks, setOverdueBooks] = useState(0);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ _id: '', title: '', author: '', isbn: '', availability: true });
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowModal, setBorrowModal] = useState({ bookId: '', title: '', isbn: '', registerNumber: '', phoneNumber: '', dueDate: '' });
  const [borrowModalError, setBorrowModalError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Pagination memo
  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return books;
    return books.filter((b) =>
      [b.title, b.author, b.isbn].some((v) => (v || '').toLowerCase().includes(term))
    );
  }, [books, searchTerm]);
  const totalPages = Math.max(1, Math.ceil((filteredBooks?.length || 0) / pageSize));
  const currentBooks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, page, pageSize]);

  // Helpers

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch stats');
      setTotalBooks(Number(data.totalBooks) || 0);
      setTotalStudents(Number(data.totalStudents) || 0);
      setIssuedBooks(Number(data.issuedBooks) || 0);
      setOverdueBooks(Number(data.overdueBooks) || 0);
    } catch (e) {
      // Surface but do not break the page
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Borrow modal handlers
  const openBorrow = (book) => {
    setBorrowModal({
      bookId: book._id,
      title: book.title || '',
      isbn: book.isbn || '',
      registerNumber: '',
      phoneNumber: '',
      dueDate: '',
    });
    setBorrowModalError('');
    setShowBorrowModal(true);
  };

  const cancelBorrow = () => {
    setShowBorrowModal(false);
    setBorrowModal({ bookId: '', title: '', isbn: '', registerNumber: '', phoneNumber: '', dueDate: '' });
    setBorrowModalError('');
  };

  const confirmBorrow = async () => {
    // Validate only what backend requires
    if (!borrowModal.registerNumber || !borrowModal.bookId || !borrowModal.dueDate) {
      setBorrowModalError('registerNumber, bookId and dueDate are required');
      return;
    }
    try {
      setLoading(true);
      setBorrowModalError('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/transactions/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookId: borrowModal.bookId,
          registerNumber: borrowModal.registerNumber,
          dueDate: borrowModal.dueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to issue book');
      // Update UI locally: mark this book as issued
      setBooks((prev) => prev.map((b) => (b._id === borrowModal.bookId ? { ...b, availability: false } : b)));
      setShowBorrowModal(false);
      // Optionally refresh counts
      fetchStats();
      fetchIssuedCount();
      fetchOverdueCount();
    } catch (e) {
      setBorrowModalError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Issued count from active transactions
  const fetchIssuedCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/transactions/issued', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return; // don't override on error
      setIssuedBooks(Array.isArray(data) ? data.length : 0);
    } catch (_) {
      // ignore
    }
  };

  // Overdue count from active overdue transactions
  const fetchOverdueCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/transactions/overdue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      setOverdueBooks(Array.isArray(data) ? data.length : 0);
    } catch (_) {}
  };

  // Edit handlers (modal)
  const startEdit = (book) => {
    setEditForm({ _id: book._id, title: book.title || '', author: book.author || '', isbn: book.isbn || '', availability: !!book.availability });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditForm({ _id: '', title: '', author: '', isbn: '', availability: true });
  };

  const saveEdit = async () => {
    if (!editForm?._id) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/books/${editForm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          author: editForm.author,
          isbn: editForm.isbn,
          availability: editForm.availability,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update book');
      setShowEditModal(false);
      setEditForm({ _id: '', title: '', author: '', isbn: '', availability: true });
      fetchBooks();
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete book');
      fetchBooks();
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const returnBookRow = async (bookId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/transactions/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to return book');
      fetchBooks();
      fetchStats();
      fetchIssuedCount();
      fetchOverdueCount();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if admin token exists
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchBooks();
      fetchIssuedCount();
      fetchOverdueCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Close action menus when clicking outside
  useEffect(() => {
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Close menus on scroll/resize so positioning doesn't get out of sync
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, []);

  // Load students when authenticated (for borrow form)
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadStudents = async () => {
      try {
        setError('');
        const token = localStorage.getItem('adminToken');
        const res = await fetch('http://localhost:5000/api/students', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
        setStudents(data || []);
      } catch (e) {
        setError(e.message);
      }
    };
    loadStudents();
  }, [isAuthenticated]);

  // Fetch books for borrow selector
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

  

  // Borrow book

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Kit Librarian Management System</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
          )}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">Working...</div>
          )}

          <div className="flex gap-6">
            {/* Left: Stats sidebar */}
            <aside className="w-64 flex-shrink-0 space-y-4">
              <Link to="/admin/books" className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Books</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalBooks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/admin/dashboard/students" className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-green-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalStudents}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/admin/dashboard/books-issued" className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-yellow-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Issued Books</dt>
                        <dd className="text-lg font-medium text-gray-900">{issuedBooks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/admin/dashboard/books-overdue" className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-red-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Overdue Books</dt>
                        <dd className="text-lg font-medium text-gray-900">{overdueBooks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>
              {/* Add Multiple Books card */}
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="block w-full text-left bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Add Multiple Books</dt>
                        <dd className="text-sm text-gray-700">Upload .xlsx or .csv</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </button>
            </aside>

            {/* Right: Books content */}
            <section className="flex-1">
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Books</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search by title, author, ISBN"
                        className="border border-gray-300 rounded-md px-3 py-2 w-72"
                        value={searchTerm}
                        onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                      />
                      <span className="text-sm text-gray-500">{filteredBooks.length} items</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentBooks.map((b) => (
                          <tr key={b._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{b.title}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{b.author}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{b.isbn}</td>
                            <td className="px-4 py-2 text-sm">
                              {b.availability ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Available</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Issued</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  onClick={(e) => {
                                    const r = e.currentTarget.getBoundingClientRect();
                                    // position menu below button; align right with 160px menu width (w-40)
                                    setMenuPos({ top: r.bottom + 8, left: Math.max(8, r.right - 160) });
                                    setOpenMenuId(openMenuId === b._id ? null : b._id);
                                  }}
                                  aria-haspopup="true"
                                  aria-expanded={openMenuId === b._id}
                                >
                                  <span className="sr-only">Open actions</span>
                                  {/* Vertical dots */}
                                  <svg className="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                              {openMenuId === b._id && createPortal(
                                (
                                  <div
                                    className="fixed z-[100] w-40 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col"
                                    style={{ top: menuPos.top, left: menuPos.left }}
                                  >
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={() => { setOpenMenuId(null); startEdit(b); }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      onClick={() => { setOpenMenuId(null); handleDelete(b._id); }}
                                    >
                                      Delete
                                    </button>
                                    {b.availability ? (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          openBorrow(b);
                                        }}
                                      >
                                        Borrow
                                      </button>
                                    ) : (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                                        onClick={() => { setOpenMenuId(null); returnBookRow(b._id); }}
                                      >
                                        Return
                                      </button>
                                    )}
                                  </div>
                                ),
                                document.body
                              )}
                            </td>
                          </tr>
                        ))}
                        {currentBooks.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">No books found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
                    <div className="space-x-2">
                      <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                      <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => { if (!uploadLoading) setShowUploadModal(false); }}></div>
          <div className="relative z-50 w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Multiple Books</h3>
              <p className="mt-1 text-sm text-gray-600">Upload an Excel (.xlsx) or CSV file containing columns: title, author, isbn, quantity. Other columns will be ignored.</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <input
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/csv,application/vnd.ms-excel"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
                disabled={uploadLoading}
              />
              {uploadFile && (
                <div className="text-xs text-gray-600">Selected: {uploadFile.name}</div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={uploadLoading}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!uploadFile) {
                    setError('Please select a file to upload');
                    return;
                  }
                  try {
                    setUploadLoading(true);
                    setError('');
                    const token = localStorage.getItem('adminToken');
                    const formData = new FormData();
                    formData.append('file', uploadFile);
                    const res = await axios.post('/api/admin/books/upload', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                    });
                    const data = res.data || {};
                    setToast(`Upload successful: inserted ${data.inserted || 0}, updated ${data.updated || 0}`);
                    setShowUploadModal(false);
                    setUploadFile(null);
                    // Refresh lists and stats
                    fetchBooks();
                    fetchStats();
                    setTimeout(() => setToast(''), 1500);
                  } catch (e) {
                    const msg = e?.response?.data?.message || e.message || 'Upload failed';
                    setError(msg);
                  } finally {
                    setUploadLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={uploadLoading || !uploadFile}
              >
                {uploadLoading ? 'Uploading...' : 'Upload'}
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
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={cancelEdit}></div>
          <div className="relative z-50 w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Book</h3>
            </div>
            <div
              className="px-6 py-4 space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!(loading || !editForm.title || !editForm.author || !editForm.isbn)) {
                    saveEdit();
                  }
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.isbn}
                  onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.availability ? 'true' : 'false'}
                  onChange={(e) => setEditForm({ ...editForm, availability: e.target.value === 'true' })}
                >
                  <option value="true">Available</option>
                  <option value="false">Issued</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700" disabled={loading || !editForm.title || !editForm.author || !editForm.isbn}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity" onClick={cancelBorrow}></div>
          <div className="relative z-50 w-full max-w-md mx-auto bg-white rounded-lg shadow-lg transform transition-all">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Borrow Book</h3>
            </div>
            <div
              className="px-6 py-4 space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!loading) {
                    confirmBorrow();
                  }
                }
              }}
            >
              {borrowModalError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{borrowModalError}</div>
              )}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Book Title</label>
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100" value={borrowModal.title} readOnly />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ISBN</label>
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100" value={borrowModal.isbn} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Register Number</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    list="borrowModalStudentsList"
                    value={borrowModal.registerNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      const match = students.find((s) => s.registerNumber === value);
                      setBorrowModal({ ...borrowModal, registerNumber: value, phoneNumber: match?.phoneNumber || '' });
                    }}
                    placeholder="Type to search register number"
                  />
                  <datalist id="borrowModalStudentsList">
                    {students.map((s) => (
                      <option key={s._id || s.registerNumber} value={s.registerNumber} />
                    ))}
                  </datalist>
                  {!borrowModal.registerNumber && borrowModalError && (
                    <p className="mt-1 text-xs text-red-600">Register number is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                    value={borrowModal.phoneNumber}
                    readOnly
                    disabled
                    placeholder="Auto-filled after selecting student"
                  />
                  {!borrowModal.phoneNumber && borrowModalError && (
                    <p className="mt-1 text-xs text-red-600">Phone number is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={borrowModal.dueDate}
                    onChange={(e) => setBorrowModal({ ...borrowModal, dueDate: e.target.value })}
                  />
                  {!borrowModal.dueDate && borrowModalError && (
                    <p className="mt-1 text-xs text-red-600">Due date is required</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={cancelBorrow} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmBorrow} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Borrow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
