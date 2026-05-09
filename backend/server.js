import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import sqlite3 from 'sqlite3'
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
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err)
  } else {
    console.log('✅ Connected to SQLite database')
    initDB()
  }
})

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON')

// Initialize tables
function initDB() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS sweets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        form_name TEXT,
        category TEXT,
        cost_price REAL,
        selling_price REAL,
        quantity INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.run(`
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
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL,
        category TEXT,
        type TEXT,
        date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      console.log('✅ Database initialized')
    })
  })
}

// Helper function to run queries with promises
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

// Sweets endpoints
app.get('/api/sweets', async (req, res) => {
  try {
    const sweets = await dbAll('SELECT * FROM sweets ORDER BY created_at DESC')
    res.json(sweets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/sweets/:id', async (req, res) => {
  try {
    const sweet = await dbGet('SELECT * FROM sweets WHERE id = ?', [req.params.id])
    if (!sweet) return res.status(404).json({ error: 'Not found' })
    res.json(sweet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/sweets', async (req, res) => {
  try {
    const { name, form_name, category, cost_price, selling_price, quantity } = req.body
    const result = await dbRun(
      `INSERT INTO sweets (name, form_name, category, cost_price, selling_price, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, form_name, category, cost_price, selling_price, quantity || 0]
    )
    const sweet = await dbGet('SELECT * FROM sweets WHERE id = ?', [result.lastID])
    res.status(201).json(sweet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/sweets/:id', async (req, res) => {
  try {
    const { name, form_name, category, cost_price, selling_price, quantity } = req.body
    await dbRun(
      `UPDATE sweets SET name=?, form_name=?, category=?, cost_price=?, selling_price=?, quantity=?
       WHERE id=?`,
      [name, form_name, category, cost_price, selling_price, quantity, req.params.id]
    )
    const sweet = await dbGet('SELECT * FROM sweets WHERE id = ?', [req.params.id])
    res.json(sweet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/sweets/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM sweets WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Sales endpoints
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await dbAll('SELECT * FROM sales ORDER BY created_at DESC')
    res.json(sales)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/sales/:id', async (req, res) => {
  try {
    const sale = await dbGet('SELECT * FROM sales WHERE id = ?', [req.params.id])
    if (!sale) return res.status(404).json({ error: 'Not found' })
    res.json(sale)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/sales', async (req, res) => {
  try {
    const { sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date } = req.body
    const saleQuantity = Math.max(1, Math.trunc(Number(quantity) || 1))
    const sweet = await dbGet('SELECT * FROM sweets WHERE id = ?', [sweet_id])

    if (!sweet) return res.status(404).json({ error: 'Doce nao encontrado' })
    if ((sweet.quantity || 0) < saleQuantity) {
      return res.status(400).json({ error: 'Estoque insuficiente para esta venda' })
    }

    await dbRun('BEGIN TRANSACTION')
    const result = await dbRun(
      `INSERT INTO sales (sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sweet_id, saleQuantity, customer_name, discount || 0, surcharge || 0, payment_method, status, notes, date]
    )
    await dbRun('UPDATE sweets SET quantity = quantity - ? WHERE id = ?', [saleQuantity, sweet_id])
    await dbRun('COMMIT')
    const sale = await dbGet('SELECT * FROM sales WHERE id = ?', [result.lastID])
    res.status(201).json(sale)
  } catch (error) {
    await dbRun('ROLLBACK').catch(() => {})
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/sales/:id', async (req, res) => {
  try {
    const { sweet_id, quantity, customer_name, discount, surcharge, payment_method, status, notes, date } = req.body
    const currentSale = await dbGet('SELECT * FROM sales WHERE id = ?', [req.params.id])
    if (!currentSale) return res.status(404).json({ error: 'Venda nao encontrada' })

    const saleQuantity = Math.max(1, Math.trunc(Number(quantity) || 1))
    const currentSweet = await dbGet('SELECT * FROM sweets WHERE id = ?', [currentSale.sweet_id])
    const nextSweet = await dbGet('SELECT * FROM sweets WHERE id = ?', [sweet_id])

    if (!nextSweet) return res.status(404).json({ error: 'Doce nao encontrado' })

    const availableQuantity = (nextSweet.quantity || 0) + (Number(currentSale.sweet_id) === Number(sweet_id) ? currentSale.quantity || 0 : 0)
    if (availableQuantity < saleQuantity) {
      return res.status(400).json({ error: 'Estoque insuficiente para esta venda' })
    }

    await dbRun('BEGIN TRANSACTION')
    if (currentSweet) {
      await dbRun('UPDATE sweets SET quantity = quantity + ? WHERE id = ?', [currentSale.quantity || 0, currentSale.sweet_id])
    }
    await dbRun(
      `UPDATE sales SET sweet_id=?, quantity=?, customer_name=?, discount=?, surcharge=?, payment_method=?, status=?, notes=?, date=?
       WHERE id=?`,
      [sweet_id, saleQuantity, customer_name, discount, surcharge, payment_method, status, notes, date, req.params.id]
    )
    await dbRun('UPDATE sweets SET quantity = quantity - ? WHERE id = ?', [saleQuantity, sweet_id])
    await dbRun('COMMIT')
    const sale = await dbGet('SELECT * FROM sales WHERE id = ?', [req.params.id])
    res.json(sale)
  } catch (error) {
    await dbRun('ROLLBACK').catch(() => {})
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const sale = await dbGet('SELECT * FROM sales WHERE id = ?', [req.params.id])
    if (sale) {
      await dbRun('UPDATE sweets SET quantity = quantity + ? WHERE id = ?', [sale.quantity || 0, sale.sweet_id])
    }
    await dbRun('DELETE FROM sales WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Expenses endpoints
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await dbAll('SELECT * FROM expenses ORDER BY created_at DESC')
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id])
    if (!expense) return res.status(404).json({ error: 'Not found' })
    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body
    const result = await dbRun(
      `INSERT INTO expenses (description, amount, category, type, date)
       VALUES (?, ?, ?, ?, ?)`,
      [description, amount, category, type, date]
    )
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [result.lastID])
    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body
    await dbRun(
      `UPDATE expenses SET description=?, amount=?, category=?, type=?, date=?
       WHERE id=?`,
      [description, amount, category, type, date, req.params.id]
    )
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id])
    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM expenses WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const sweets = await dbAll('SELECT * FROM sweets')
    const sales = await dbAll('SELECT * FROM sales')
    const expenses = await dbAll('SELECT * FROM expenses')

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
    const balance = total_sales - total_expenses

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
app.post('/api/recipes/brownies', async (req, res) => {
  try {
    // Create expense
    await dbRun(
      `INSERT INTO expenses (description, amount, category, type, date)
       VALUES (?, ?, ?, ?, ?)`,
      ['Receita: Brownies', -16, 'Ingredientes', 'Fixo', new Date().toISOString().split('T')[0]]
    )

    // Check if brownie already exists
    const brownie = await dbGet('SELECT * FROM sweets WHERE name = ?', ['Brownie'])

    if (brownie) {
      await dbRun('UPDATE sweets SET quantity = quantity + 12 WHERE id = ?', [brownie.id])
    } else {
      await dbRun(
        `INSERT INTO sweets (name, form_name, category, cost_price, selling_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Brownie', 'Unidade', 'Chocolate', 2, 4, 12]
      )
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📁 Database: ${dbPath}`)
})
