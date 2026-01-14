const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurações
app.use(cors());
app.use(express.json()); // Express já possui parser de JSON nativo

// Configuração do Gemini (Baseado na sua lista de modelos disponíveis)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Alterado para gemini-2.0-flash que apareceu como disponível no seu curl
const model = genAI.getGenerativeModel({
    model: "gemma-3-4b-it",
    generationConfig: {
        maxOutputTokens: 40, // Respostas curtas são geradas mais rápido
        temperature: 0.4,    // Menos "criatividade" = mais velocidade
    }
});

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

// --- ROTAS API ---

// Listar Tarefas
app.get('/api/tasks', (req, res) => {
    db.query('SELECT * FROM tasks ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Criar Tarefa (Adicionada pois faltava no seu código)
app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;
    db.query('INSERT INTO tasks (title, description) VALUES (?, ?)', [title, description], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).json({ id: result.insertId, title, description });
    });
});

// Rota de IA: Sugerir descrição
app.post('/api/ai/suggest', async (req, res) => {
    const { taskTitle } = req.body;

    if (!taskTitle) {
        return res.status(400).json({ error: 'O título da tarefa é obrigatório' });
    }

    // 1. Criamos o controlador para abortar a missão
    const controller = new AbortController();
    // 2. Definimos o tempo máximo (5 segundos). Se passar disso, ele cancela.
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const prompt = `Gere APENAS uma frase curta de descrição para a tarefa: "${taskTitle}". Não use tópicos.`;

        // 3. Passamos o signal para a chamada da IA
        const result = await model.generateContent(prompt, { signal: controller.signal });
        const response = await result.response;
        
        clearTimeout(timeoutId); // Resposta chegou a tempo, cancelamos o timer de erro

        res.json({ suggestion: response.text().trim() });

    } catch (error) {
        clearTimeout(timeoutId);

        // Verifica se o erro foi causado pelo nosso limite de 5 segundos
        if (error.name === 'AbortError') {
            console.error('TIMEOUT: A IA demorou mais de 5s. Cancelando espera infinita.');
            return res.json({ 
                suggestion: `Planejamento e execução para: ${taskTitle}`,
                status: 'fallback' 
            });
        }

        console.error('ERRO DETALHADO:', error.message);
        
        // Se for erro de cota (429) ou qualquer outro, responde rápido com texto padrão
        res.json({ 
            suggestion: `Organizar atividades de: ${taskTitle}`,
            status: 'error'
        });
    }
});

// Atualizar Tarefa
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    db.query('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
        [title, description, status, id], (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Tarefa atualizada com sucesso' });
        });
});

// Remover Tarefa
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Tarefa removida com sucesso' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});