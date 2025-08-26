import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FloatingDecor from '../components/FloatingDecor';
import api from '../utils/api';

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(null);

  // Refs for outside-click handling of notifications dropdown
  const notifBtnRef = useRef(null);
  const notifPanelRef = useRef(null);

  // Close notifications when clicking outside or pressing Escape
  useEffect(() => {
    if (!notifOpen) return;

    const onDown = (e) => {
      const btn = notifBtnRef.current;
      const panel = notifPanelRef.current;
      if (!btn || !panel) return;
      if (btn.contains(e.target) || panel.contains(e.target)) return;
      setNotifOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  useEffect(() => {
    // Ping current to check auth via cookie; redirect if unauthorized
    (async () => {
      try {
        const { data } = await api.get('/api/student/current');
        setCurrent(data.currentBooks || []);
      } catch (e) {
        // ignore initial error; can still use page
      }
    })();
  }, [navigate]);

  const fetchCurrent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/student/current');
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

  // Load notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/api/student/notifications');
      if (Array.isArray(data?.items)) setNotifications(data.items);
      if (data?.lastReadAt) setLastReadAt(data.lastReadAt);
      // lastClearedAt is handled server-side to filter items; no local state needed
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = useMemo(() => {
    const lr = lastReadAt ? new Date(lastReadAt) : new Date(0);
    return notifications.filter(n => new Date(n.at) > lr).length;
  }, [notifications, lastReadAt]);

  const markAllAsRead = async () => {
    try {
      const { data } = await api.post('/api/student/notifications/read');
      setLastReadAt(data?.lastReadAt || new Date().toISOString());
    } catch (_) {}
  };

  const clearAllNotifications = async () => {
    try {
      const { data } = await api.post('/api/student/notifications/clear');
      setNotifications([]);
      // lastClearedAt not stored locally
      if (data?.lastReadAt) setLastReadAt(data.lastReadAt);
    } catch (_) {}
  };

  // Fetch discovery sections (recent and popular)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDiscLoading(true);
        const [{ data: rData }, { data: pData }] = await Promise.all([
          api.get('/api/books/recent', { params: { limit: 8 } }),
          api.get('/api/books/popular', { params: { limit: 8 } }),
        ]);
        if (!cancelled) {
          setRecent(Array.isArray(rData) ? rData : []);
          setPopular(Array.isArray(pData) ? pData : []);
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
      let params = {};
      if (query.includes(':')) {
        const [key, ...rest] = query.split(':');
        const val = rest.join(':').trim();
        if (key.trim().toLowerCase() === 'author') params.author = val;
        else params.title = val;
      } else {
        params.title = query.trim();
      }
      const { data } = await api.get('/api/books/search', { params });
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/student/logout');
    } catch {}
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col relative">
      <FloatingDecor />
      {/* Global Header */}
      <header className="relative z-40 w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/90 object-contain" onError={(e)=>{e.currentTarget.style.display='none';}} />
            <div className="min-w-0">
              <p className="text-slate-100 text-base sm:text-xl font-bold tracking-wide whitespace-normal md:whitespace-nowrap break-words leading-snug">Student Dashboard</p>
              <p className="text-slate-300 text-xs sm:text-sm leading-tight">Search books and view your current reading</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* Notifications */}
            <button
              ref={notifBtnRef}
              onClick={() => setNotifOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 hover:bg-slate-800/70 relative"
              aria-label="Notifications"
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] h-4 min-w-[16px] px-1">
                  {Math.min(9, unreadCount)}{unreadCount > 9 ? '+' : ''}
                </span>
              )}
            </button>
            {notifOpen && (
              <div ref={notifPanelRef} className="absolute right-24 sm:right-32 top-full mt-2 w-72 max-h-80 overflow-auto no-scrollbar rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur shadow-xl p-0 z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <div className="text-sm text-slate-300">Notifications</div>
                  {notifications.length > 0 && (
                    <div className="flex gap-3">
                      <button onClick={markAllAsRead} className="text-xs text-indigo-300 hover:text-indigo-200">Mark all as read</button>
                      <button onClick={clearAllNotifications} className="text-xs text-rose-300 hover:text-rose-200">Clear all</button>
                    </div>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-sm text-slate-300 p-3">No notifications</div>
                ) : (
                  <ul className="space-y-1 p-2">
                    {notifications.map((n, idx) => (
                      <li key={idx} className="rounded-md p-2 bg-slate-800/60 border border-white/5">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 text-indigo-300">
                            {n.type === 'borrow' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M4 4h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V4z" />
                              </svg>
                            )}
                            {n.type === 'return' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M10 17l-5-5 5-5v3h8v4h-8v3z" />
                              </svg>
                            )}
                            {n.type === 'dueSoon' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h-3V7h2v4h1z" />
                              </svg>
                            )}
                            {n.type === 'overdue' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h-3V7h2v4h1zm-3 4h4v-2h-4z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 text-sm">
                            <div className="font-medium text-slate-100 truncate">{n.title}</div>
                            <div className="text-slate-300 text-xs truncate">{n.message}</div>
                            <div className="text-slate-500 text-[10px] mt-0.5">{new Date(n.at).toLocaleString()}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <Link to="/student/profile" className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 hover:bg-slate-800/70">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" />
              </svg>
            </Link>
            <button onClick={() => setShowLogoutModal(true)} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 hover:bg-slate-800/70">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path d="M16 17v-2h-4v-2h4V11l3 3-3 3z" />
                <path d="M14 7V5H5v14h9v-2H7V7h7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-3 sm:px-6 py-6 sm:py-8 flex-1">
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

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded bg-rose-500/15 p-2 text-rose-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-100">Confirm Logout</h3>
                <p className="mt-1 text-sm text-slate-300">Are you sure you want to log out of your account?</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowLogoutModal(false)} className="btn-muted px-4 py-2">Cancel</button>
              <button onClick={logout} className="btn-primary-blue px-4 py-2">Logout</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto">
        <div className="w-full h-12" />
      </footer>
    </div>
  );
};

export default StudentDashboard;
