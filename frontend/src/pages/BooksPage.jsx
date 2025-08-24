import React, { useEffect, useMemo, useState } from 'react';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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

  return (
    <div className="min-h-screen lib-bg flex flex-col">
      <header className="relative overflow-hidden shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-stone-800" />
        <div className="relative container mx-auto px-4 py-6 text-amber-50">
          <h1 className="text-2xl md:text-3xl font-serif-academic font-extrabold">Library Books</h1>
          <p className="text-amber-100/90">Browse all books in the library</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
        )}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">Loading...</div>
        )}

        {/* Search bar */}
        <div className="mb-6 flex justify-center">
          <div className="book-card border-gold rounded-lg w-full sm:w-[28rem]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or author..."
              className="w-full bg-transparent px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div key={book._id} className="book-card border-gold bg-white rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">{book.title}</h2>
                  <p className="text-sm text-stone-600">{book.author}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${book.availability ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {book.availability ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          ))}
          {filteredBooks.length === 0 && !loading && !error && (
            <div className="col-span-full text-center text-stone-500">No books found.</div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={fetchBooks}
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 shadow hover:bg-stone-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </main>

      <footer className="mt-auto">
        <div className="shelf-bg h-16 md:h-20 w-full" />
      </footer>
    </div>
  );
};

export default BooksPage;
