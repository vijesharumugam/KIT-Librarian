import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingDecor from '../components/FloatingDecor';
import api from '../utils/api';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/books');
      setBooks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filter books in real-time by title or author (case-insensitive)
  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) =>
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q)
    );
  }, [books, search]);

  // Use the landing page's dark/glass theme
  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col relative">
      <FloatingDecor />
      {/* Global Header to match landing */}
      <header className="relative z-10 w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/90 object-contain"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
            <div className="min-w-0">
              <p className="text-slate-100 text-base sm:text-xl font-bold tracking-wide whitespace-normal md:whitespace-nowrap break-words leading-snug">All Books</p>
              <p className="text-slate-300 text-xs sm:text-sm leading-tight">Browse the complete library catalog</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M15 18l-6-6 6-6v12z" />
            </svg>
            Go Back
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-3 sm:px-6 py-6 sm:py-8 flex-1">
        {error && (
          <div className="mb-4 rounded-md border border-red-400/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
        )}
        {loading && (
          <div className="mb-4 rounded-md border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">Loading...</div>
        )}

        {/* Search Section */}
        <section className="glass-card rounded-2xl bg-slate-900/50 border border-white/10 shadow-xl">
          <div className="p-4 sm:p-6">
            <h2 className="mb-3 text-lg sm:text-xl font-extrabold text-slate-100">Search</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or author..."
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-10 py-2.5 text-slate-100 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                onClick={fetchBooks}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 btn-primary-blue w-full sm:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 6V3L8 7l4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Books Grid */}
        <section className="mt-6 sm:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <div key={book._id} className="flex flex-col rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow-sm transition hover:bg-slate-900/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base sm:text-lg font-semibold text-slate-100">{book.title}</h3>
                    <p className="truncate text-sm text-slate-400">{book.author}</p>
                  </div>
                  <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${book.availability ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                    {book.availability ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && !loading && !error && (
              <div className="col-span-full rounded-md border border-white/10 bg-slate-900/50 px-4 py-4 text-center text-slate-300">No books found.</div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-auto">
        <div className="w-full h-12" />
      </footer>
    </div>
  );
};

export default BooksPage;

