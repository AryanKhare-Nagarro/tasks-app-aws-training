const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const { SecretManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

async function getDBCredentials() {
    const client = new SecretManagerClient({
        region: process.env.AWS_REGION || 'us-east-1'
    });

    const command = new GetSecretValueCommand({
        SecretId: process.env.SECRET_NAME
    });

    const response = await client.send(command);
    const secret = JSON.parse(response.SecretString);
    return secret;
}

let db;

async function initDB() {
    try {
        const secret = await getDBCredentials();

        db = mysql.createConnection({
            user: secret.username,
            password: secret.password,
            engine: secret.engine,
            host: secret.host,
            port: secret.port,
            dbname: secret.dbname,
            dbInstanceIdentifier: secret.dbInstanceIdentifier
        });

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
    } catch (err) {
        console.error('Error fetching DB credentials:', err);
    }
}

// MySQL connection
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT 
// });

// // Connect to MySQL
// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err);
//     return;
//   }
//     console.log('Connected to MySQL');

//     db.query(`CREATE TABLE IF NOT EXISTS tasks (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         title VARCHAR(255))
//         `);
// });

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

initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

// testing CI/CD pipeline