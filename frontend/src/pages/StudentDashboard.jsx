import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  // Using HttpOnly cookie for auth; no token in JS state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);
  const [discLoading, setDiscLoading] = useState(false);

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

  // Fetch discovery sections (recent and popular)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDiscLoading(true);
        const [rRes, pRes] = await Promise.all([
          fetch('http://localhost:5000/api/books/recent?limit=8'),
          fetch('http://localhost:5000/api/books/popular?limit=8'),
        ]);
        const [rData, pData] = await Promise.all([rRes.json(), pRes.json()]);
        if (!cancelled) {
          if (rRes.ok) setRecent(Array.isArray(rData) ? rData : []);
          if (pRes.ok) setPopular(Array.isArray(pData) ? pData : []);
        }
      } catch (_) {
        // ignore discovery errors for now
      } finally {
        if (!cancelled) setDiscLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-50 via-amber-50 to-stone-100">
      {/* Top Navbar with subtle wood grain gradient */}
      <header className="relative overflow-hidden shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-800" />
        {/* bookshelf pattern overlay using repeating linear gradients */}
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(66,41,24,0.25) 0, rgba(66,41,24,0.25) 2px, transparent 2px, transparent 12px)',
          }}
        />
        <div className="relative container mx-auto px-4 py-4 sm:py-5">
          <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Library Logo"
                className="h-10 w-10 rounded-full bg-white/90 p-1 shadow ring-1 ring-emerald-300/30"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="text-emerald-50">
                <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-wide">Student Dashboard</h1>
                <p className="text-emerald-100/80 text-xs sm:text-sm">Search books and view your current reading</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-4">
              <Link
                to="/student/profile"
                className="group inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-50/10 px-3 py-2 text-emerald-50 backdrop-blur hover:bg-emerald-50/20 transition text-sm w-full sm:w-auto justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90 group-hover:opacity-100">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" />
                </svg>
                <span className="font-medium">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="group inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-50/10 px-3 py-2 text-emerald-50 backdrop-blur hover:bg-emerald-50/20 transition text-sm w-full sm:w-auto justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90 group-hover:opacity-100">
                  <path d="M16 17v-2h-4v-2h4V11l3 3-3 3z" />
                  <path d="M14 7V5H5v14h9v-2H7V7h7z" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {loading && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Working...</div>
        )}

        {/* Search Section */}
        <section className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          {/* parchment-like top strip */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200" />
          <div className="p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-stone-800 sm:text-xl">Search Books</h2>
            <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-stone-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by title or 'author: Name'"
                  className="w-full rounded-md border border-stone-300 bg-white px-10 py-2.5 text-stone-800 placeholder-stone-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                disabled={!canSearch || loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-emerald-50 shadow hover:bg-emerald-800 disabled:opacity-60 w-full sm:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M3 12h13v2H3zM10 5h2v13h-2z" />
                </svg>
                Search
              </button>
            </form>

            {/* Results */}
            <div className="mt-5 sm:mt-6">
              {results.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-stone-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-stone-400">
                    <path d="M18 2H6a2 2 0 0 0-2 2v15l4-3h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                  </svg>
                  <span className="text-sm">No results yet</span>
                </div>
              ) : (
                <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {results.map((b) => (
                    <li key={b._id} className="group flex items-center justify-between rounded-md border border-stone-200 bg-white p-3 shadow-sm transition hover:shadow">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 rounded bg-emerald-100 p-2 text-emerald-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M4 4h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V4z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-stone-900">{b.title}</div>
                          <div className="truncate text-sm text-stone-600">{b.author} · ISBN {b.isbn}</div>
                        </div>
                      </div>
                      <span className={`whitespace-nowrap rounded px-2 py-1 text-sm ${b.availability ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                        {b.availability ? 'Available' : 'Not available'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Current Reading */}
        <section className="mt-6 sm:mt-8">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-sm">
            <div className="h-2 w-full bg-gradient-to-r from-stone-300 via-amber-200 to-stone-300" />
            <div className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-stone-800 sm:text-xl">Current Reading</h2>
              {current.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-6 text-stone-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-stone-400">
                    <path d="M18 2H8a2 2 0 0 0-2 2v15l4-3h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                  </svg>
                  <div>
                    <p className="text-sm sm:text-base">You have no borrowed books.</p>
                    <p className="text-xs text-stone-500">Search above to find your next great read.</p>
                  </div>
                </div>
              ) : (
                <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {current.map((c, idx) => (
                    <li
                      key={c._id || idx}
                      className="group flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded bg-emerald-50 p-2 text-emerald-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                            <path d="M6 2h10a2 2 0 0 1 2 2v17l-7-3-7 3V4a2 2 0 0 1 2-2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-stone-900">{c.title || 'Unknown title'}</div>
                          <div className="truncate text-sm text-stone-600">{c.author} · ISBN {c.isbn}</div>
                          {c.dueDate && (
                            <div className="mt-1 text-xs text-stone-500">Due: {new Date(c.dueDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Recently Added */}
        <section className="mt-6 sm:mt-10">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-sm">
            <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-emerald-200 to-stone-300" />
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-800 sm:text-xl">Recently Added</h2>
                <Link to="/books" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">View all</Link>
              </div>
              {discLoading && recent.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg border border-stone-200 bg-stone-100" />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4 text-stone-600">No recent books to display.</div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {recent.slice(0, 4).map((b) => (
                    <li key={b._id} className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm hover:shadow">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded bg-emerald-50 p-2 text-emerald-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M6 2h10a2 2 0 0 1 2 2v17l-7-3-7 3V4a2 2 0 0 1 2-2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-stone-900">{b.title}</div>
                          <div className="truncate text-sm text-stone-600">{b.author}</div>
                        </div>
                      </div>
                      <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${b.availability ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.availability ? 'Available' : 'Not Available'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Popular Books */}
        <section className="mt-6 sm:mt-10 mb-6 sm:mb-10">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-sm">
            <div className="h-2 w-full bg-gradient-to-r from-stone-300 via-amber-200 to-emerald-200" />
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-800 sm:text-xl">Popular Books</h2>
                <Link to="/books" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">View all</Link>
              </div>
              {discLoading && popular.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg border border-stone-200 bg-stone-100" />
                  ))}
                </div>
              ) : popular.length === 0 ? (
                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4 text-stone-600">No popular books to display.</div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {popular.map((b) => (
                    <li key={b._id} className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm hover:shadow">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded bg-amber-50 p-2 text-amber-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M4 4h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V4z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-stone-900">{b.title}</div>
                          <div className="truncate text-sm text-stone-600">{b.author}</div>
                        </div>
                      </div>
                      <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${b.availability ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.availability ? 'Available' : 'Not Available'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
