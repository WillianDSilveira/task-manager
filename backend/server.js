const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Configuração do Banco de Dados (MySQL)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'task_manager'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
    
    // Criar tabela se não existir
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('pending', 'completed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTableQuery, (err) => {
        if (err) console.error('Erro ao criar tabela:', err);
    });
});

// Rotas CRUD
app.get('/api/tasks', (req, res) => {
    db.query('SELECT * FROM tasks ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;
    db.query('INSERT INTO tasks (title, description) VALUES (?, ?)', [title, description], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, title, description, status: 'pending' });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    db.query('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?', [title, description, status, id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Tarefa atualizada com sucesso' });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Tarefa removida com sucesso' });
    });
});

// Integração com IA (Exemplo simples)
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/ai/suggest', async (req, res) => {
    const { taskTitle } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{ role: "user", content: `Sugira uma descrição curta para a tarefa: ${taskTitle}` }],
        });
        res.json({ suggestion: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao consultar IA' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
