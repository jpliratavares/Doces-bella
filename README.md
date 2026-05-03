# Doces da Bella - Webapp

Aplicação web para controle de orçamento e gestão de vendas de doces.

## 🚀 Deploy

### GitHub Pages (Frontend)
O frontend é automaticamente deployado no GitHub Pages via GitHub Actions.
- URL: `https://jpliratavares.github.io/Doces-bella`

### Railway (Backend)
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project" → "Deploy from GitHub"
3. Selecione o repositório `Doces-bella`
4. Railway detectará o `Procfile` e fará deploy automático
5. Copie a URL gerada (ex: `https://your-app.up.railway.app`)

### Conectar Frontend ao Backend
No arquivo `frontend/.env.local`, adicione:
```
VITE_API_URL=https://sua-railway-url.up.railway.app/api
```

---

## 📦 Setup Local

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:3000`

---

## 📁 Estrutura do Projeto

```
doces_bella_novo/
├── backend/          # API FastAPI + SQLite
│   ├── main.py       # Endpoints da API
│   ├── models.py     # Modelos SQLAlchemy
│   ├── schemas.py    # Schemas Pydantic
│   ├── database.py   # Configuração DB
│   ├── Procfile      # Para Railway
│   └── requirements.txt
├── frontend/         # Interface React + Vite
│   ├── src/
│   │   ├── screens/  # Dashboard, Sweets, Sales, Expenses
│   │   ├── App.jsx
│   │   ├── api.js    # Configuração Axios
│   │   └── main.jsx
│   ├── .env.example  # Variáveis de ambiente
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
- ✅ **Receita de brownies**: +12 unidades, -R$ 16 de despesa
- ✅ Estoque em tempo real

---

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite 5 + Axios
- **Backend**: FastAPI + Uvicorn + SQLAlchemy
- **Database**: SQLite
- **Deploy**: GitHub Pages + Railway
- ✅ Dashboard com resumo financeiro
- ✅ Persistência em banco de dados SQLite
