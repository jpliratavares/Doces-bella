import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize Express
const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(bodyParser.json())

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'doces_bella.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize tables
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      form_name TEXT,
      category TEXT,
      cost_price REAL,
      selling_price REAL,
      quantity INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sweet_id INTEGER NOT NULL,
      quantity INTEGER,
      customer_name TEXT,
      discount REAL DEFAULT 0,
      surcharge REAL DEFAULT 0,
      payment_method TEXT,
      status TEXT,
      notes TEXT,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sweet_id) REFERENCES sweets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL,
      category TEXT,
      type TEXT,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  console.log('✅ Database initialized')
}

// Sweets endpoints
app.get('/api/sweets', (req, res) => {
  try {
    const sweets = db.prepare('SELECT * FROM sweets ORDER BY created_at DESC').all()
    res.json(sweets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/sweets/:id', (req, res) => {
  try {
    const sweet = db.prepare('SELECT * FROM sweets WHERE id = ?').get(req.params.id)
    if (!sweet) return res.status(404).json({ error: 'Not found' })
    res.json(sweet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/sweets', (req, res) => {
  try {
    const { name, form_name, category, cost_price, selling_price, quantity } = req.body
    const stmt = db.prepare(`
      INSERT INTO sweets (name, form_name, category, cost_price, selling_price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(name, form_name, category, cost_price, selling_price, quantity || 0)
    const sweet = db.prepare('SELECT * FROM sweets WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(sweet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/sweets/:id', (req, res) => {
  try {
    const { name, form_name, category, cost_price, selling_price, quantity } = req.body
    db.prepare(`
      UPDATE sweets SET name=?, form_name=?, category=?, cost_price=?, selling_price=?, quantity=?
      WHERE id=?
    `).run(name, form_name, category, cost_price, selling_price, quantity, req.params.id)
    const sweet = db.prepare('SELECT * FROM sweets WHERE id = ?').get(req.params.id)
    res.json(sweet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/sweets/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM sweets WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Sales endpoints
app.get('/api/sales', (req, res) => {
  try {
    const sales = db.prepare('SELECT * FROM sales ORDER BY created_at DESC').all()
    res.json(sales)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/sales/:id', (req, res) => {
  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id)
    if (!sale) return res.status(404).json({ error: 'Not found' })
    res.json(sale)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/sales', (req, res) => {
  try {
    const { sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date } = req.body
    const stmt = db.prepare(`
      INSERT INTO sales (sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(sweet_id, quantity, customer_name, discount || 0, surcharge || 0, payment_method, status, notes, date)
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(sale)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/sales/:id', (req, res) => {
  try {
    const { sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date } = req.body
    db.prepare(`
      UPDATE sales SET sweet_id=?, quantity=?, customer_name=?, discount=?, surcharge=?, payment_method=?, status=?, notes=?, date=?
      WHERE id=?
    `).run(sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date, req.params.id)
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id)
    res.json(sale)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/sales/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Expenses endpoints
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all()
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/expenses/:id', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id)
    if (!expense) return res.status(404).json({ error: 'Not found' })
    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/expenses', (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body
    const stmt = db.prepare(`
      INSERT INTO expenses (description, amount, category, type, date)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(description, amount, category, type, date)
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/expenses/:id', (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body
    db.prepare(`
      UPDATE expenses SET description=?, amount=?, category=?, type=?, date=?
      WHERE id=?
    `).run(description, amount, category, type, date, req.params.id)
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id)
    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/expenses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  try {
    const sweets = db.prepare('SELECT * FROM sweets').all()
    const sales = db.prepare('SELECT * FROM sales').all()
    const expenses = db.prepare('SELECT * FROM expenses').all()

    const sweets_count = sweets.length
    const sales_count = sales.length
    const expenses_count = expenses.length
    const total_quantity = sweets.reduce((sum, s) => sum + (s.quantity || 0), 0)

    let total_sales = 0
    for (const sale of sales) {
      const sweet = sweets.find(s => s.id === sale.sweet_id)
      if (sweet) {
        total_sales += (sweet.selling_price * sale.quantity - sale.discount + sale.surcharge)
      }
    }

    const total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const balance = total_sales + total_expenses

    res.json({
      sweets_count,
      sales_count,
      expenses_count,
      total_sales,
      total_expenses,
      balance,
      total_quantity
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Recipe endpoint - Brownies
app.post('/api/recipes/brownies', (req, res) => {
  try {
    // Create expense
    const expenseStmt = db.prepare(`
      INSERT INTO expenses (description, amount, category, type, date)
      VALUES (?, ?, ?, ?, ?)
    `)
    expenseStmt.run('Receita: Brownies', -16, 'Ingredientes', 'Fixo', new Date().toISOString().split('T')[0])

    // Check if brownie exists
    const brownie = db.prepare('SELECT * FROM sweets WHERE name = ?').get('Brownie')

    if (brownie) {
      db.prepare('UPDATE sweets SET quantity = quantity + 12 WHERE id = ?').run(brownie.id)
    } else {
      db.prepare(`
        INSERT INTO sweets (name, form_name, category, cost_price, selling_price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Brownie', 'Unidade', 'Chocolate', 2, 4, 12)
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Start server
initDB()
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📁 Database: ${dbPath}`)
})
