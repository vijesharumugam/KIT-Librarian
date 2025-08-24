const express = require('express');
const router = express.Router();
const { getBooks, searchBooks, createBook, updateBook, deleteBook, getRecentBooks, getPopularBooks } = require('../controllers/booksController');

router.get('/search', searchBooks);
router.get('/recent', getRecentBooks);
router.get('/popular', getPopularBooks);
router.get('/', getBooks);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
