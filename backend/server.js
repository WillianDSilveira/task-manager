const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();

// Configurações Globais
app.use(cors());
app.use(express.json());

// 1. Configuração do Gemini - Usando modelo estável 1.5-flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
    generationConfig: {
        maxOutputTokens: 40,
        temperature: 0.4,
    }
});

// 2. Configuração do Banco de Dados (Priorizando variáveis do Railway)
const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    connectTimeout: 10000 // 10 segundos para evitar timeout no deploy
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('❌ Erro crítico ao conectar ao MySQL:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco de dados no Railway.');

    // Criar tabela se não existir (Nome padronizado para 'tasks')
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTableQuery, (err) => {
        if (err) console.error('Erro ao verificar/criar tabela:', err);
    });
});

// --- ROTAS API ---

// Listar Tarefas
app.get('/api/tasks', (req, res) => {
    db.query('SELECT * FROM tasks ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Criar Tarefa
app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;
    db.query('INSERT INTO tasks (title, description) VALUES (?, ?)', [title, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, title, description });
    });
});

// Rota de IA: Sugerir descrição com Timeout de Segurança
app.post('/api/ai/suggest', async (req, res) => {
    const { taskTitle } = req.body;
    if (!taskTitle) return res.status(400).json({ error: 'O título é obrigatório' });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos para IA

    try {
        const prompt = `Sugira uma descrição curtíssima (máximo 10 palavras) para a tarefa: "${taskTitle}".`;
        const result = await model.generateContent(prompt, { signal: controller.signal });
        const response = await result.response;
        
        clearTimeout(timeoutId);
        res.json({ suggestion: response.text().trim() });
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('IA Error:', error.message);
        res.json({ suggestion: `Organizar detalhes de: ${taskTitle}`, status: 'fallback' });
    }
});

// Atualizar Tarefa
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    db.query('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
        [title, description, status, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Tarefa atualizada' });
        });
});

// Remover Tarefa
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tarefa removida' });
    });
});

// Porta dinâmica obrigatória para Railway/Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor pronto na porta ${PORT}`);
});