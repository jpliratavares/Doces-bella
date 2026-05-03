# Doces da Bella - Webapp

Aplicação web para controle de orçamento e gestão de vendas de doces.

## 🚀 Deploy - 2 Opções

### Opção 1: Desenvolvimento Local (Recomendado)
**Backend Node.js + SQLite local**
- Simples, rápido, sem dependências externas
- Dados salvos localmente em `backend/doces_bella.db`
- Perfeito para usar enquanto desenvolve

### Opção 2: Produção (GitHub Pages)
**Frontend no GitHub Pages + Supabase**
- Deploy automático via GitHub Actions
- Backend na nuvem (Supabase gratuito)
- Dados sincronizados globalmente

---

## 🔧 Setup Local (SQLite)

### 1️⃣ Instalar dependências do Backend

```bash
cd backend
npm install
```

### 2️⃣ Rodar Backend

```bash
npm start
# ou
npm run dev
```

Servidor estará em: `http://localhost:8000`

Database será criado em: `backend/doces_bella.db`

### 3️⃣ Rodar Frontend (nova aba do terminal)

```bash
cd frontend
npm install
npm run dev
```

Acesse em: `http://localhost:3000`

---

## 🌐 Deploy no GitHub Pages (Produção)

### Pré-requisito: Supabase (Gratuito)

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta e novo projeto
3. Copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `Anon Public Key` → `VITE_SUPABASE_ANON_KEY`

### Criar Tabelas no Supabase

No editor SQL do Supabase:

```sql
CREATE TABLE sweets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  form_name TEXT,
  category TEXT,
  cost_price FLOAT,
  selling_price FLOAT,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  sweet_id BIGINT REFERENCES sweets(id) ON DELETE CASCADE,
  quantity INTEGER,
  customer_name TEXT,
  discount FLOAT DEFAULT 0,
  surcharge FLOAT DEFAULT 0,
  payment_method TEXT,
  status TEXT,
  notes TEXT,
  date TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount FLOAT,
  category TEXT,
  type TEXT,
  date TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Ativar RLS (Row Level Security)

Para cada tabela, no Supabase:
1. Clique em **"Enable RLS"**
2. **"New policy"** → **"For every user, using (true)"**
3. Marque: SELECT, INSERT, UPDATE, DELETE

### Fazer Deploy

GitHub Actions fará automaticamente:
- ✅ Build do React
- ✅ Deploy para GitHub Pages

Frontend em: `https://jpliratavares.github.io/Doces-bella`

---

## 📁 Estrutura

```
doces_bella_novo/
├── backend/                    # Node.js + SQLite
│   ├── server.js              # Express server
│   ├── package.json           # Dependências
│   ├── doces_bella.db         # Banco SQLite (criado automaticamente)
│   └── node_modules/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── screens/           # Dashboard, Sweets, Sales, Expenses
│   │   ├── App.jsx
│   │   ├── api.js             # Axios client
│   │   └── main.jsx
│   ├── .env.example           # Template de variáveis
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/deploy.yml   # GitHub Actions
└── README.md
```

---

## ✨ Funcionalidades

- ✅ Dashboard com resumo de vendas e estoque
- ✅ Cadastro de doces com controle de margem
- ✅ Registro de vendas com descontos/acréscimos
- ✅ Controle de despesas
- ✅ Receita de brownies: +12 unidades, -R$ 16 de despesa
- ✅ Estoque em tempo real
- ✅ Sincronização instantânea frontend-backend

---

## 🛠️ Tecnologias

**Development:**
- Frontend: React 18 + Vite 5
- Backend: Express.js + SQLite3
- HTTP Client: Axios

**Production:**
- Frontend: GitHub Pages (estático)
- Backend: Supabase (PostgreSQL na nuvem)

**Ambas as opções são 100% gratuitas ✅**

---

## 🆓 Planos Gratuitos

**Backend Node.js Local:**
- Sem limite, roda na sua máquina

**Supabase (Produção):**
- PostgreSQL ilimitado
- 500 MB de armazenamento
- Realtime: 100 conexões simultâneas
- 5 GB de banda

---

## 📝 Próximos Passos

1. ✅ Clonar repositório
2. ✅ Rodar `npm install` em backend e frontend
3. ✅ Rodar `npm start` no backend
4. ✅ Rodar `npm run dev` no frontend
5. Acessar `http://localhost:3000`

Simples assim! 🎉
- ✅ Dashboard com resumo financeiro
- ✅ Persistência em banco de dados SQLite
