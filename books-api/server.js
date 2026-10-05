const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());                 // allow other origins to call the API
app.use(express.json());         // parse JSON bodies into req.body
app.use(express.static(path.join(__dirname, 'public'))); // serve index.html

// Simple request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ---------- In-memory data ----------
let books = [
    { id: 1, title: 'The Alchemist', author: 'Paulo Coelho' },
    { id: 2, title: 'Atomic Habits', author: 'James Clear' },
];
let nextId = 3;

// Helper: find a book or send 404
function findBook(req, res) {
    const book = books.find(b => b.id === Number(req.params.id));
    if (!book) res.status(404).json({ error: 'Book not found' });
    return book;
}

// Helper: validate title and author
function isValid(body) {
    return body && typeof body.title === 'string' && body.title.trim()
        && typeof body.author === 'string' && body.author.trim();
}

// ---------- Routes ----------

// GET all books
app.get('/books', (req, res) => {
    res.status(200).json(books);
});

// GET one book
app.get('/books/:id', (req, res) => {
    const book = findBook(req, res);
    if (book) res.status(200).json(book);
});

// POST create a book
app.post('/books', (req, res) => {
    if (!isValid(req.body)) {
        return res.status(400).json({ error: 'title and author are required' });
    }
    const book = {
        id: nextId++,
        title: req.body.title.trim(),
        author: req.body.author.trim(),
    };
    books.push(book);
    res.status(201).json(book);
});

// PUT update a book
app.put('/books/:id', (req, res) => {
    const book = findBook(req, res);
    if (!book) return;
    if (!isValid(req.body)) {
        return res.status(400).json({ error: 'title and author are required' });
    }
    book.title = req.body.title.trim();
    book.author = req.body.author.trim();
    res.status(200).json(book);
});

// DELETE a book
app.delete('/books/:id', (req, res) => {
    const index = books.findIndex(b => b.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Book not found' });
    books.splice(index, 1);
    res.status(204).send();
});

// ---------- 404 + error handling ----------

// Unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must have 4 params and come last)
app.use((err, req, res, next) => {
    console.error(err.message);
    // Bad JSON sent by the client
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    res.status(err.status || 500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});