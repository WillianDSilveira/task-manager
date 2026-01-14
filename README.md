# Gerenciador de Tarefas Fullstack (Node.js + Angular + MySQL + IA)

Este projeto é um sistema simples de gerenciamento de tarefas desenvolvido como um projeto prático individual. Ele utiliza uma arquitetura moderna com backend em Node.js, frontend em Angular e integração com Inteligência Artificial para sugestão de descrições.

## Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Banco de Dados:** MySQL
- **Frontend:** Angular (v17+), Bootstrap, Bootstrap Icons
- **IA:** OpenAI API (GPT-4o-mini)
- **Versionamento:** Git

## Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (v18 ou superior)
- [MySQL Server](https://dev.mysql.com/downloads/installer/)
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

## Configuração do Projeto

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd task-manager
```

### 2. Configurar o Backend
1. Entre na pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Renomeie o arquivo `.env.example` para `.env`.
   - Edite o `.env` com suas credenciais do MySQL e sua chave da OpenAI:
     ```env
     DB_HOST=localhost
     DB_USER=seu_usuario
     DB_PASSWORD=sua_senha
     DB_NAME=task_manager
     OPENAI_API_KEY=sua_chave_aqui
     ```
4. Crie o banco de dados no MySQL:
   ```sql
   CREATE DATABASE task_manager;
   ```
5. Inicie o servidor:
   ```bash
   node server.js
   ```
   O backend estará rodando em `http://localhost:3000`.

### 3. Configurar o Frontend
1. Abra um novo terminal e entre na pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   ng serve
   ```
4. Acesse o projeto em seu navegador: `http://localhost:4200`.

## Funcionalidades

- **CRUD de Tarefas:** Criar, listar, atualizar status (concluído/pendente) e excluir tarefas.
- **Integração com IA:** Ao digitar um título e clicar em "Sugerir Descrição", o sistema utiliza a API da OpenAI para gerar uma descrição criativa para a tarefa.
- **Interface Responsiva:** Desenvolvida com Bootstrap para funcionar em diferentes tamanhos de tela.

## Estrutura de Commits (Git)

O projeto segue um fluxo básico de desenvolvimento:
- `feat:` para novas funcionalidades.
- `fix:` para correção de bugs.
- `docs:` para documentação.
- `style:` para alterações de estilo/UI.
