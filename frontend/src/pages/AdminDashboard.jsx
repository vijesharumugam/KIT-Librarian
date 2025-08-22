import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ title: '', author: '', isbn: '' });
  const [editRow, setEditRow] = useState(null); // book _id currently being edited
  const [students, setStudents] = useState([]);
  const [borrowForm, setBorrowForm] = useState({ registerNumber: '', bookId: '', dueDate: '' });
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [issuedBooks, setIssuedBooks] = useState(0);
  const [overdueBooks, setOverdueBooks] = useState(0);

  // Simple ComboBox component (local)
  const ComboBox = ({ items, getLabel, getValue, placeholder, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [inputVal, setInputVal] = useState('');
    const boxRef = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    // When external value changes, sync display
    useEffect(() => {
      const selected = items.find((it) => String(getValue(it)) === String(value));
      setInputVal(selected ? getLabel(selected) : '');
    }, [value, items, getLabel, getValue]);

    const filtered = useMemo(() => {
      const q = (inputVal || '').toLowerCase();
      if (!q) return items.slice(0, 50);
      return items.filter((it) => getLabel(it).toLowerCase().includes(q)).slice(0, 50);
    }, [items, inputVal, getLabel]);

    const selectItem = (it) => {
      onChange(getValue(it));
      setInputVal(getLabel(it));
      setOpen(false);
    };

    return (
      <div className="relative" ref={boxRef}>
        <input
          type="text"
          placeholder={placeholder}
          className="border border-gray-300 rounded-md px-3 py-2 w-full"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
            {filtered.map((it) => (
              <button
                type="button"
                key={String(getValue(it))}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => selectItem(it)}
              >
                {getLabel(it)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const fetchStats = async () => {
    try {
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
      fetchBooks();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // fetch students list for borrow form
    const loadStudents = async () => {
      try {
        setError('');
        const token = localStorage.getItem('adminToken');
        const res = await fetch('http://localhost:5000/api/students', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
        setStudents(data);
        // refresh stats in case students count changed
        fetchStats();
      } catch (e) {
        setError(e.message);
      }
    };
    loadStudents();
  }, [isAuthenticated]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/books');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch books');
      setBooks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add book');
      setCreateForm({ title: '', author: '', isbn: '' });
      fetchBooks();
      // update stats after adding a new book
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (book) => {
    setEditRow({
      _id: book._id,
      availability: !!book.availability,
      dueDate: book.dueDate ? book.dueDate.substring(0, 10) : '',
    });
  };

  const cancelEdit = () => setEditRow(null);

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/books/${editRow._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability: editRow.availability,
          dueDate: editRow.dueDate ? new Date(editRow.dueDate).toISOString() : null,
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
    if (!window.confirm('Delete this book?')) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete book');
      fetchBooks();
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitBorrow = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/transactions/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...borrowForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to issue book');
      setBorrowForm({ registerNumber: '', bookId: '', dueDate: '' });
      fetchBooks();
      fetchStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const returnBook = async (bookId) => {
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
            <div className="bg-white overflow-hidden shadow rounded-lg">
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
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
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
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
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
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
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
            </div>
          </div>

          {/* Borrow Book */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Borrow Book</h3>
              <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={submitBorrow}>
                <ComboBox
                  items={students}
                  getLabel={(s) => `${s.registerNumber} (${s.phoneNumber})`}
                  getValue={(s) => s.registerNumber}
                  placeholder="Search/select student"
                  value={borrowForm.registerNumber}
                  onChange={(val) => setBorrowForm({ ...borrowForm, registerNumber: val })}
                />

                <ComboBox
                  items={books.filter((b) => b.availability)}
                  getLabel={(b) => `${b.title} · ${b.author} (ISBN ${b.isbn})`}
                  getValue={(b) => b._id}
                  placeholder="Search/select book"
                  value={borrowForm.bookId}
                  onChange={(val) => setBorrowForm({ ...borrowForm, bookId: val })}
                />

                <input
                  type="date"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={borrowForm.dueDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                />

                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700" disabled={loading || !borrowForm.registerNumber || !borrowForm.bookId || !borrowForm.dueDate}>
                  {loading ? 'Issuing...' : 'Issue Book'}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center">
                  Add New Book
                </button>
                <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center">
                  Register Student
                </button>
                <button className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors text-center">
                  Issue Book
                </button>
                <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center">
                  View Reports
                </button>
              </div>
            </div>
          </div>

          {/* Create Book */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Book</h3>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleCreate}>
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

          {/* Books Table */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Books</h3>
                <button onClick={fetchBooks} className="text-sm bg-gray-100 border px-3 py-1 rounded hover:bg-gray-200">Refresh</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {books.map((b) => (
                      <tr key={b._id}>
                        <td className="px-4 py-2 whitespace-nowrap">{b.title}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.author}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.isbn}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.availability ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right space-x-2">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={() => startEdit(b)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => handleDelete(b._id)}
                          >
                            Delete
                          </button>
                          {!b.availability && (
                            <button
                              className="ml-2 text-emerald-700 hover:underline"
                              onClick={() => returnBook(b._id)}
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {books.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No books found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Inline Edit Panel */}
          {editRow && (
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Book Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editRow.availability}
                      onChange={(e) => setEditRow({ ...editRow, availability: e.target.checked })}
                    />
                    <span>Available</span>
                  </label>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      className="border border-gray-300 rounded-md px-3 py-2"
                      value={editRow.dueDate}
                      onChange={(e) => setEditRow({ ...editRow, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Save</button>
                    <button onClick={cancelEdit} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
