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
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Global Header */}
      <header className="w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/90 object-contain" onError={(e)=>{e.currentTarget.style.display='none';}} />
            <div className="min-w-0">
              <p className="text-slate-100 text-base sm:text-xl font-bold tracking-wide whitespace-normal md:whitespace-nowrap break-words leading-snug">Student Dashboard</p>
              <p className="text-slate-300 text-xs sm:text-sm leading-tight">Search books and view your current reading</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/student/profile" className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 hover:bg-slate-800/70">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" />
              </svg>
              <span className="font-medium">Profile</span>
            </Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 hover:bg-slate-800/70">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path d="M16 17v-2h-4v-2h4V11l3 3-3 3z" />
                <path d="M14 7V5H5v14h9v-2H7V7h7z" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-6 sm:py-8 flex-1">
        {error && (
          <div className="mb-4 rounded-md border border-red-400/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
        )}
        {loading && (
          <div className="mb-4 rounded-md border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">Working...</div>
        )}

        {/* Search Section */}
        <section className="glass-card rounded-2xl bg-slate-900/50 border border-white/10 shadow-xl">
          <div className="p-4 sm:p-6">
            <h2 className="mb-3 text-lg sm:text-xl font-extrabold text-slate-100">Search Books</h2>
            <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by title or 'author: Name'"
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-10 py-2.5 text-slate-100 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button disabled={!canSearch || loading} className="inline-flex items-center justify-center gap-2 btn-primary-blue w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M3 12h13v2H3zM10 5h2v13h-2z" />
                </svg>
                Search
              </button>
            </form>

            {/* Results */}
            <div className="mt-5 sm:mt-6">
              {results.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-900/50 px-4 py-3 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-400">
                    <path d="M18 2H6a2 2 0 0 0-2 2v15l4-3h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                  </svg>
                  <span className="text-sm">No results yet</span>
                </div>
              ) : (
                <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {results.map((b) => (
                    <li key={b._id} className="group flex items-center justify-between rounded-md border border-white/10 bg-slate-900/40 p-3 shadow-sm transition hover:bg-slate-900/60">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 rounded bg-indigo-500/10 p-2 text-indigo-300">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M4 4h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V4z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{b.title}</div>
                          <div className="truncate text-sm text-slate-400">
                            {b.author}
                            <span className="hidden sm:inline"> · ISBN {b.isbn}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`whitespace-nowrap rounded px-2 py-1 text-sm ${b.availability ? 'bg-green-500/15 text-green-300' : 'bg-amber-500/15 text-amber-300'}`}>
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
          <div className="glass-card rounded-2xl bg-slate-900/50 border border-white/10 shadow-xl">
            <div className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg sm:text-xl font-extrabold text-slate-100">Current Reading</h2>
              {current.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-900/50 px-4 py-6 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-slate-400">
                    <path d="M18 2H8a2 2 0 0 0-2 2v15l4-3h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                  </svg>
                  <div>
                    <p className="text-sm sm:text-base">You have no borrowed books.</p>
                    <p className="text-xs text-slate-400">Search above to find your next great read.</p>
                  </div>
                </div>
              ) : (
                <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {current.map((c, idx) => (
                    <li
                      key={c._id || idx}
                      className="group flex flex-col rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow-sm transition hover:bg-slate-900/60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded bg-indigo-500/10 p-2 text-indigo-300">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                            <path d="M6 2h10a2 2 0 0 1 2 2v17l-7-3-7 3V4a2 2 0 0 1 2-2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-100">{c.title || 'Unknown title'}</div>
                          <div className="truncate text-sm text-slate-400">
                            {c.author}
                            <span className="hidden sm:inline"> · ISBN {c.isbn}</span>
                          </div>
                          {c.dueDate && (
                            <div className="mt-1 text-xs text-slate-400">Due: {new Date(c.dueDate).toLocaleDateString()}</div>
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
          <div className="glass-card rounded-2xl bg-slate-900/50 border border-white/10 shadow-xl">
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100">Recently Added</h2>
                <Link to="/books" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">View all</Link>
              </div>
              {discLoading && recent.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg border border-white/10 bg-slate-900/40" />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-slate-900/50 px-4 py-4 text-slate-300">No recent books to display.</div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {recent.slice(0, 4).map((b) => (
                    <li key={b._id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3 shadow-sm hover:bg-slate-900/60">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded bg-indigo-500/10 p-2 text-indigo-300">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M6 2h10a2 2 0 0 1 2 2v17l-7-3-7 3V4a2 2 0 0 1 2-2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{b.title}</div>
                          <div className="truncate text-sm text-slate-400">{b.author}</div>
                        </div>
                      </div>
                      <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${b.availability ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
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
          <div className="glass-card rounded-2xl bg-slate-900/50 border border-white/10 shadow-xl">
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100">Popular Books</h2>
                <Link to="/books" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">View all</Link>
              </div>
              {discLoading && popular.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg border border-white/10 bg-slate-900/40" />
                  ))}
                </div>
              ) : popular.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-slate-900/50 px-4 py-4 text-slate-300">No popular books to display.</div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {popular.map((b) => (
                    <li key={b._id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3 shadow-sm hover:bg-slate-900/60">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded bg-indigo-500/10 p-2 text-indigo-300">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M4 4h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V4z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{b.title}</div>
                          <div className="truncate text-sm text-slate-400">{b.author}</div>
                        </div>
                      </div>
                      <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${b.availability ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
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

      <footer className="mt-auto">
        <div className="w-full h-12" />
      </footer>
    </div>
  );
};

export default StudentDashboard;
