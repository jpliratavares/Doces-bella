# Doces da Bella - Webapp

Aplicação web para controle de orçamento e gestão de vendas de doces.

## 🚀 Deploy - Tudo em um lugar!

**GitHub Pages + Supabase = Sem backend separado!**

### Frontend + Backend no GitHub Pages + Supabase

Tudo roda em um único lugar! O frontend fica no GitHub Pages e o banco de dados no Supabase (gratuito).

---

## 🔧 Setup Inicial

### 1️⃣ Criar conta no Supabase (Gratuito)

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Sign Up"**
3. Crie um novo **Project** (qualquer nome)
4. Copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `Anon Public Key` → `VITE_SUPABASE_ANON_KEY`

### 2️⃣ Criar tabelas no Supabase

No editor SQL do Supabase, execute:

```sql
-- Tabela de doces
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

-- Tabela de vendas
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

-- Tabela de despesas
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

### 3️⃣ Configurar acesso público nas tabelas

No Supabase:
- Vá para **Authentication** → **Policies**
- Para cada tabela (sweets, sales, expenses):
  - Clique em **"Enable RLS"**
  - Depois **"New policy"** → **"For every user, using (true)"**
  - SELECT, INSERT, UPDATE, DELETE → Escolha "Allow"

### 4️⃣ Configurar variáveis de ambiente

1. Copie `.env.example` para `.env.local`
2. Preencha com suas credenciais do Supabase:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

### 5️⃣ Instalar dependências e rodar localmente

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:3000`

---

## 🌐 Deploy no GitHub Pages

1. Push para GitHub (já configurado):
```bash
git add .
git commit -m "Switch to Supabase backend"
git push
```

2. GitHub Actions fará:
   - Build do React
   - Deploy automático para GitHub Pages

3. Frontend estará em: **`https://jpliratavares.github.io/Doces-bella`**

---

## 📁 Estrutura do Projeto

```
doces_bella_novo/
├── backend/          # ❌ Removido! Agora usa Supabase
├── frontend/         # Interface React + Vite + Supabase
│   ├── src/
│   │   ├── screens/  # Dashboard, Sweets, Sales, Expenses
│   │   ├── App.jsx
│   │   ├── api.js    # Integração com Supabase
│   │   ├── supabaseClient.js  # Configuração Supabase
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/deploy.yml  # GitHub Actions
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
- ✅ Tudo sincronizado na nuvem (Supabase)

---

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite 5 + Supabase JS Client
- **Backend**: Supabase (PostgreSQL + API automática)
- **Deploy**: GitHub Pages (estático) + Supabase (banco de dados)
- **Hospedagem**: 100% gratuita ✅

---

## 🆓 Plano Gratuito Supabase

- ✅ PostgreSQL ilimitado
- ✅ 500 MB de armazenamento
- ✅ Realtime: 100 conexões simultâneas
- ✅ 5 GB de banda

Perfeito para pequenos projetos! 🎉
- ✅ Dashboard com resumo financeiro
- ✅ Persistência em banco de dados SQLite
