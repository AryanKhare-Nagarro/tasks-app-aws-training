const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT 
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
    console.log('Connected to MySQL');

    db.query(`CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255))
        `);
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.get('/tasks', (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        } else {
            res.json(results);
        }
    });
});

app.post('/tasks', (req, res) => {
    const { title } = req.body;
    db.query('INSERT INTO tasks (title) VALUES (?)', [title], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            res.status(500).json({ error: 'Failed to add task' });
        } else {
            res.status(201).json({ id: result.insertId, title });
        }
    });
});

app.use(express.static(path.join(__dirname, 'dist')));

// app.use((req, res) => {
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// testing CI/CD pipeline