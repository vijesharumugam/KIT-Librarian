import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  const [borrowForm, setBorrowForm] = useState({ registerNumber: '', bookId: '', bookDisplay: '', dueDate: '' });
  const [createForm, setCreateForm] = useState({ title: '', author: '', isbn: '', totalQuantity: 1 });
  const [editRow, setEditRow] = useState(null); // holds editable book object
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');

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
  const bookLabel = (b) => `${b.title} · ${b.author} (ISBN ${b.isbn})`;

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

  // Inline edit handlers
  const startEdit = (book) => {
    setEditRow({ ...book, dueDate: book.dueDate ? book.dueDate.substring(0, 10) : '' });
  };

  const cancelEdit = () => setEditRow(null);

  const saveEdit = async () => {
    if (!editRow?._id) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/books/${editRow._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editRow.title,
          author: editRow.author,
          isbn: editRow.isbn,
          availability: editRow.availability,
          dueDate: editRow.dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update book');
      setEditRow(null);
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

  // Create new book
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          author: createForm.author,
          isbn: createForm.isbn,
          totalQuantity: Number(createForm.totalQuantity)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add book');
      setCreateForm({ title: '', author: '', isbn: '', totalQuantity: 1 });
      fetchBooks();
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Borrow book
  const submitBorrow = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      // Resolve bookId from typed label if needed
      let chosenBookId = borrowForm.bookId;
      if (!chosenBookId && borrowForm.bookDisplay) {
        const match = books.find((b) => b.availability && bookLabel(b).toLowerCase() === borrowForm.bookDisplay.trim().toLowerCase());
        if (match) chosenBookId = match._id;
      }
      if (!chosenBookId) {
        setLoading(false);
        setError('Please select a valid available book');
        return;
      }
      const res = await fetch('http://localhost:5000/api/transactions/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ registerNumber: borrowForm.registerNumber, bookId: chosenBookId, dueDate: borrowForm.dueDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to issue book');
      setBorrowForm({ registerNumber: '', bookId: '', bookDisplay: '', dueDate: '' });
      fetchBooks();
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <Link to="/admin/books" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
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

            <Link to="/admin/dashboard/students" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-green-500">
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

            <Link to="/admin/dashboard/books-issued" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-yellow-500">
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Books Issued</dt>
                      <dd className="text-lg font-medium text-gray-900">{issuedBooks}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/admin/dashboard/books-overdue" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-red-500">
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
          </div>

          {/* Books Management Table */}
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

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentBooks.map((b) => (
                      <tr key={b._id} className="hover:bg-gray-50">
                        {editRow?._id === b._id ? (
                          <>
                            <td className="px-4 py-2">
                              <input className="border rounded px-2 py-1 w-full" value={editRow.title} onChange={(e) => setEditRow({ ...editRow, title: e.target.value })} />
                            </td>
                            <td className="px-4 py-2">
                              <input className="border rounded px-2 py-1 w-full" value={editRow.author} onChange={(e) => setEditRow({ ...editRow, author: e.target.value })} />
                            </td>
                            <td className="px-4 py-2">
                              <input className="border rounded px-2 py-1 w-full" value={editRow.isbn} onChange={(e) => setEditRow({ ...editRow, isbn: e.target.value })} />
                            </td>
                            <td className="px-4 py-2">
                              <select className="border rounded px-2 py-1" value={editRow.availability} onChange={(e) => setEditRow({ ...editRow, availability: e.target.value === 'true' })}>
                                <option value="true">Available</option>
                                <option value="false">Issued</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input type="date" className="border rounded px-2 py-1" value={editRow.dueDate || ''} onChange={(e) => setEditRow({ ...editRow, dueDate: e.target.value })} />
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              <button onClick={saveEdit} className="text-emerald-700 hover:text-emerald-900 mr-3">Save</button>
                              <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
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
                            <td className="px-4 py-2 text-sm text-gray-900">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              <button onClick={() => startEdit(b)} className="text-blue-700 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDelete(b._id)} className="text-red-700 hover:text-red-900 mr-3">Delete</button>
                              {b.availability ? (
                                <button onClick={() => { setBorrowForm({ ...borrowForm, bookId: b._id }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-emerald-700 hover:text-emerald-900">Borrow</button>
                              ) : (
                                <button onClick={() => returnBookRow(b._id)} className="text-indigo-700 hover:text-indigo-900">Return</button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {currentBooks.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">No books found</td>
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

          {/* Borrow Book */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Borrow Book</h3>
              <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={submitBorrow}>
                {/* Searchable Student ComboBox via datalist */}
                <div>
                  <input
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    list="studentsList"
                    placeholder="Type to search student"
                    value={borrowForm.registerNumber}
                    onChange={(e) => setBorrowForm({ ...borrowForm, registerNumber: e.target.value })}
                    required
                  />
                  <datalist id="studentsList">
                    {students.map((s) => (
                      <option key={s._id || s.registerNumber} value={s.registerNumber}>{`${s.registerNumber} ${s.phoneNumber ? `(${s.phoneNumber})` : ''}`}</option>
                    ))}
                  </datalist>
                </div>

                {/* Searchable Book ComboBox via datalist */}
                <div>
                  <input
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    list="booksList"
                    placeholder="Type to search available book"
                    value={borrowForm.bookDisplay}
                    onChange={(e) => setBorrowForm({ ...borrowForm, bookDisplay: e.target.value, bookId: '' })}
                    required
                  />
                  <datalist id="booksList">
                    {books.filter((b) => b.availability).map((b) => (
                      <option key={b._id} value={`${b.title} · ${b.author} (ISBN ${b.isbn})`}></option>
                    ))}
                  </datalist>
                </div>

                <input
                  type="date"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={borrowForm.dueDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                />

                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700" disabled={loading || !borrowForm.registerNumber || !(borrowForm.bookId || borrowForm.bookDisplay) || !borrowForm.dueDate}>
                  {loading ? 'Issuing...' : 'Issue Book'}
                </button>
              </form>
            </div>
          </div>

          {/* Create Book */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Book</h3>
              <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={handleCreate}>
                <input
                  type="text"
                  required
                  placeholder="Title"
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
                <input
                  type="text"
                  required
                  placeholder="Author"
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={createForm.author}
                  onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
                />
                <input
                  type="text"
                  required
                  placeholder="ISBN"
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={createForm.isbn}
                  onChange={(e) => setCreateForm({ ...createForm, isbn: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Total Quantity"
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={createForm.totalQuantity}
                  onChange={(e) => setCreateForm({ ...createForm, totalQuantity: e.target.value })}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Book'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
