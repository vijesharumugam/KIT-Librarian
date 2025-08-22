const Book = require('../models/Book');

// GET /api/books - list all books
const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/books/search?title=&author=
const searchBooks = async (req, res) => {
  try {
    const { title, author } = req.query;
    const query = {};
    if (title) query.title = { $regex: title, $options: 'i' };
    if (author) query.author = { $regex: author, $options: 'i' };
    if (!title && !author) return res.status(400).json({ message: 'Provide title or author' });

    const books = await Book.find(query).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('Search books error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/books - add new book
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, availability, dueDate } = req.body;
    if (!title || !author || !isbn) {
      return res.status(400).json({ message: 'title, author and isbn are required' });
    }

    const exists = await Book.findOne({ isbn });
    if (exists) return res.status(409).json({ message: 'A book with this ISBN already exists' });

    const book = await Book.create({
      title,
      author,
      isbn,
      availability: availability !== undefined ? availability : true,
      dueDate: dueDate || null,
    });

    res.status(201).json(book);
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/books/:id - update book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, availability, dueDate } = req.body;

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (isbn !== undefined) book.isbn = isbn;
    if (availability !== undefined) book.availability = availability;
    if (dueDate !== undefined) book.dueDate = dueDate || null;

    await book.save();
    res.json(book);
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/books/:id - remove book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByIdAndDelete(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBooks,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
};
