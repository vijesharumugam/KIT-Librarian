import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  // Using HttpOnly cookie for auth; no token in JS state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Ping current to check auth via cookie; redirect if unauthorized
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/student/current', {
          credentials: 'include',
        });
        if (res.status === 401) {
          navigate('/student/login');
          return;
        }
        const data = await res.json();
        if (res.ok) {
          setCurrent(data.currentBooks || []);
        }
      } catch (e) {
        // ignore initial error; can still use page
      }
    })();
  }, [navigate]);

  const fetchCurrent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/student/current', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load current books');
      setCurrent(data.currentBooks || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const canSearch = useMemo(() => query.trim().length > 1, [query]);

  

  const search = async (e) => {
    e.preventDefault();
    if (!canSearch) return;
    try {
      setLoading(true);
      setError('');
      const url = new URL('http://localhost:5000/api/books/search');
      if (query.includes(':')) {
        const [key, ...rest] = query.split(':');
        const val = rest.join(':').trim();
        if (key.trim().toLowerCase() === 'author') url.searchParams.set('author', val);
        else url.searchParams.set('title', val);
      } else {
        url.searchParams.set('title', query.trim());
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/student/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-600 text-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-emerald-100">Search books and view your current reading</p>
          </div>
          <button onClick={logout} className="bg-white/10 px-4 py-2 rounded hover:bg-white/20">Logout</button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>)}
        {loading && (<div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">Working...</div>)}

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Search Books</h2>
          <form onSubmit={search} className="flex gap-3">
            <input
              type="text"
              placeholder="Search by title or 'author: Name'"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button disabled={!canSearch || loading} className="bg-emerald-600 text-white px-4 py-2 rounded-md disabled:opacity-50">Search</button>
          </form>

          {/* Results */}
          <div className="mt-6">
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">No results yet.</p>
            ) : (
              <ul className="divide-y">
                {results.map((b) => (
                  <li key={b._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{b.title}</div>
                      <div className="text-sm text-gray-600">{b.author} · ISBN {b.isbn}</div>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${b.availability ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.availability ? 'Available' : 'Not available'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Current Reading */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">Current Reading</h2>
          {current.length === 0 ? (
            <p className="text-gray-500 text-sm">You have no borrowed books.</p>
          ) : (
            <ul className="divide-y">
              {current.map((c, idx) => (
                <li key={c._id || idx} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{c.title || 'Unknown title'}</div>
                    <div className="text-sm text-gray-600">{c.author} · ISBN {c.isbn}</div>
                  </div>
                  {/* Due date no longer tracked on student items; if needed, fetch from Transaction */}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
