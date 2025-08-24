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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Library Books</h1>
          <p className="text-indigo-100">Browse all books in the library</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
        )}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">Loading...</div>
        )}

        {/* Search bar */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full sm:w-96 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div key={book._id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{book.title}</h2>
                  <p className="text-sm text-gray-600">{book.author}</p>
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
            <div className="col-span-full text-center text-gray-500">No books found.</div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={fetchBooks}
            className="bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </main>
    </div>
  );
};

export default BooksPage;
