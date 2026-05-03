# Doces da Bella - Webapp

Aplicação web para controle de orçamento e gestão de vendas de doces.

## Estrutura do Projeto

```
doces_bella_novo/
├── backend/          # API FastAPI + SQLite
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   └── requirements.txt
├── frontend/         # Interface React + Vite
│   ├── src/
│   │   ├── screens/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup

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

## Funcionalidades

- ✅ Cadastro de doces
- ✅ Registro de vendas
- ✅ Controle de despesas
- ✅ Dashboard com resumo financeiro
- ✅ Persistência em banco de dados SQLite
