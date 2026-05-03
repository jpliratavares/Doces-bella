import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const storageKey = 'doces-bella-local-db-v1'

const browserAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const emptyState = () => ({
  sweets: [],
  sales: [],
  expenses: [],
})

let memoryState = emptyState()

const clone = (value) => JSON.parse(JSON.stringify(value))

const todayIso = () => new Date().toISOString()

const toNumber = (value) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

const normalizeDate = (value) => {
  if (!value) return todayIso()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? todayIso() : date.toISOString()
}

const loadState = () => {
  if (!browserAvailable) {
    return memoryState
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey)
    if (!storedValue) return memoryState

    const parsedValue = JSON.parse(storedValue)
    return {
      sweets: Array.isArray(parsedValue.sweets) ? parsedValue.sweets : [],
      sales: Array.isArray(parsedValue.sales) ? parsedValue.sales : [],
      expenses: Array.isArray(parsedValue.expenses) ? parsedValue.expenses : [],
    }
  } catch {
    return memoryState
  }
}

const saveState = (nextState) => {
  memoryState = clone(nextState)

  if (!browserAvailable) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextState))
}

const nextId = (items) => items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1

const sortByCreatedAtDesc = (items) => [...items].sort((left, right) => {
  return new Date(right.created_at || 0) - new Date(left.created_at || 0)
})

const calculateSaleTotal = (sale, sweets) => {
  const sweet = sweets.find((item) => Number(item.id) === Number(sale.sweet_id))
  if (!sweet) return 0

  return (
    toNumber(sweet.selling_price) * toNumber(sale.quantity) -
    toNumber(sale.discount) +
    toNumber(sale.surcharge)
  )
}

const makeResponse = (data) => Promise.resolve({ data: clone(data) })

const localApi = {
  get: async (url) => {
    const state = loadState()

    if (url === '/sweets') {
      return makeResponse(sortByCreatedAtDesc(state.sweets))
    }

    if (url.startsWith('/sweets/')) {
      const id = Number(url.split('/').pop())
      return makeResponse(state.sweets.find((item) => Number(item.id) === id) || null)
    }

    if (url === '/sales') {
      return makeResponse(sortByCreatedAtDesc(state.sales))
    }

    if (url.startsWith('/sales/')) {
      const id = Number(url.split('/').pop())
      return makeResponse(state.sales.find((item) => Number(item.id) === id) || null)
    }

    if (url === '/expenses') {
      return makeResponse(sortByCreatedAtDesc(state.expenses))
    }

    if (url.startsWith('/expenses/')) {
      const id = Number(url.split('/').pop())
      return makeResponse(state.expenses.find((item) => Number(item.id) === id) || null)
    }

    if (url === '/dashboard') {
      const totalSales = state.sales.reduce((sum, sale) => sum + calculateSaleTotal(sale, state.sweets), 0)
      const totalExpenses = state.expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)

      return makeResponse({
        sweets_count: state.sweets.length,
        sales_count: state.sales.length,
        expenses_count: state.expenses.length,
        total_quantity: state.sweets.reduce((sum, sweet) => sum + toNumber(sweet.quantity), 0),
        total_sales: totalSales,
        total_expenses: totalExpenses,
        balance: totalSales + totalExpenses,
      })
    }

    throw new Error(`Unsupported local GET endpoint: ${url}`)
  },

  post: async (url, payload = {}) => {
    const state = loadState()

    if (url === '/sweets') {
      const nextSweet = {
        id: nextId(state.sweets),
        name: payload.name?.trim() || 'Doce sem nome',
        form_name: payload.form_name || '',
        category: payload.category || 'Doce',
        cost_price: toNumber(payload.cost_price),
        selling_price: toNumber(payload.selling_price),
        quantity: toNumber(payload.quantity),
        created_at: todayIso(),
      }

      state.sweets.unshift(nextSweet)
      saveState(state)
      return makeResponse(nextSweet)
    }

    if (url === '/sales') {
      const sweetId = Number(payload.sweet_id)
      const sweetExists = state.sweets.some((item) => Number(item.id) === sweetId)

      if (!sweetExists) {
        throw new Error('Doce não encontrado')
      }

      const nextSale = {
        id: nextId(state.sales),
        sweet_id: sweetId,
        quantity: Math.max(1, Math.trunc(toNumber(payload.quantity) || 1)),
        customer_name: payload.customer_name || '',
        discount: toNumber(payload.discount),
        surcharge: toNumber(payload.surcharge),
        payment_method: payload.payment_method || 'Pix',
        status: payload.status || 'Pago',
        notes: payload.notes || '',
        date: normalizeDate(payload.date),
        created_at: todayIso(),
      }

      state.sales.unshift(nextSale)
      saveState(state)
      return makeResponse(nextSale)
    }

    if (url === '/expenses') {
      const nextExpense = {
        id: nextId(state.expenses),
        description: payload.description || 'Despesa sem descrição',
        amount: toNumber(payload.amount),
        category: payload.category || 'Geral',
        type: payload.type || 'Variável',
        date: normalizeDate(payload.date),
        created_at: todayIso(),
      }

      state.expenses.unshift(nextExpense)
      saveState(state)
      return makeResponse(nextExpense)
    }

    if (url === '/recipes/brownies') {
      const brownieIndex = state.sweets.findIndex((item) => item.name === 'Brownie')

      if (brownieIndex >= 0) {
        state.sweets[brownieIndex] = {
          ...state.sweets[brownieIndex],
          quantity: toNumber(state.sweets[brownieIndex].quantity) + 12,
        }
      } else {
        state.sweets.unshift({
          id: nextId(state.sweets),
          name: 'Brownie',
          form_name: 'Unidade',
          category: 'Chocolate',
          cost_price: 2,
          selling_price: 4,
          quantity: 12,
          created_at: todayIso(),
        })
      }

      state.expenses.unshift({
        id: nextId(state.expenses),
        description: 'Receita: Brownies',
        amount: -16,
        category: 'Ingredientes',
        type: 'Fixo',
        date: new Date().toISOString().split('T')[0],
        created_at: todayIso(),
      })

      saveState(state)
      return makeResponse({ success: true })
    }

    throw new Error(`Unsupported local POST endpoint: ${url}`)
  },

  put: async (url, payload = {}) => {
    const state = loadState()

    if (url.startsWith('/sweets/')) {
      const id = Number(url.split('/').pop())
      const index = state.sweets.findIndex((item) => Number(item.id) === id)
      if (index === -1) throw new Error('Doce não encontrado')

      state.sweets[index] = {
        ...state.sweets[index],
        name: payload.name?.trim() || state.sweets[index].name,
        form_name: payload.form_name ?? state.sweets[index].form_name,
        category: payload.category ?? state.sweets[index].category,
        cost_price: toNumber(payload.cost_price),
        selling_price: toNumber(payload.selling_price),
        quantity: payload.quantity !== undefined ? toNumber(payload.quantity) : toNumber(state.sweets[index].quantity),
      }

      saveState(state)
      return makeResponse(state.sweets[index])
    }

    if (url.startsWith('/sales/')) {
      const id = Number(url.split('/').pop())
      const index = state.sales.findIndex((item) => Number(item.id) === id)
      if (index === -1) throw new Error('Venda não encontrada')

      state.sales[index] = {
        ...state.sales[index],
        sweet_id: payload.sweet_id !== undefined ? Number(payload.sweet_id) : Number(state.sales[index].sweet_id),
        quantity: payload.quantity !== undefined ? Math.max(1, Math.trunc(toNumber(payload.quantity))) : state.sales[index].quantity,
        customer_name: payload.customer_name ?? state.sales[index].customer_name,
        discount: payload.discount !== undefined ? toNumber(payload.discount) : toNumber(state.sales[index].discount),
        surcharge: payload.surcharge !== undefined ? toNumber(payload.surcharge) : toNumber(state.sales[index].surcharge),
        payment_method: payload.payment_method ?? state.sales[index].payment_method,
        status: payload.status ?? state.sales[index].status,
        notes: payload.notes ?? state.sales[index].notes,
        date: payload.date ? normalizeDate(payload.date) : state.sales[index].date,
      }

      saveState(state)
      return makeResponse(state.sales[index])
    }

    if (url.startsWith('/expenses/')) {
      const id = Number(url.split('/').pop())
      const index = state.expenses.findIndex((item) => Number(item.id) === id)
      if (index === -1) throw new Error('Despesa não encontrada')

      state.expenses[index] = {
        ...state.expenses[index],
        description: payload.description ?? state.expenses[index].description,
        amount: payload.amount !== undefined ? toNumber(payload.amount) : toNumber(state.expenses[index].amount),
        category: payload.category ?? state.expenses[index].category,
        type: payload.type ?? state.expenses[index].type,
        date: payload.date ? normalizeDate(payload.date) : state.expenses[index].date,
      }

      saveState(state)
      return makeResponse(state.expenses[index])
    }

    throw new Error(`Unsupported local PUT endpoint: ${url}`)
  },

  delete: async (url) => {
    const state = loadState()

    if (url.startsWith('/sweets/')) {
      const id = Number(url.split('/').pop())
      state.sweets = state.sweets.filter((item) => Number(item.id) !== id)
      state.sales = state.sales.filter((item) => Number(item.sweet_id) !== id)
      saveState(state)
      return makeResponse({ success: true })
    }

    if (url.startsWith('/sales/')) {
      const id = Number(url.split('/').pop())
      state.sales = state.sales.filter((item) => Number(item.id) !== id)
      saveState(state)
      return makeResponse({ success: true })
    }

    if (url.startsWith('/expenses/')) {
      const id = Number(url.split('/').pop())
      state.expenses = state.expenses.filter((item) => Number(item.id) !== id)
      saveState(state)
      return makeResponse({ success: true })
    }

    throw new Error(`Unsupported local DELETE endpoint: ${url}`)
  },
}

const httpApi = configuredApiUrl
  ? axios.create({
      baseURL: configuredApiUrl,
    })
  : null

const shouldFallbackToLocal = (error) => {
  return !error?.response || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')
}

const request = async (method, url, payload) => {
  if (!httpApi) {
    return localApi[method](url, payload)
  }

  try {
    return await httpApi[method](url, payload)
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      return localApi[method](url, payload)
    }

    throw error
  }
}

const transport = {
  get: (url) => request('get', url),
  post: (url, payload) => request('post', url, payload),
  put: (url, payload) => request('put', url, payload),
  delete: (url) => request('delete', url),
}

export const sweetsApi = {
  getAll: () => transport.get('/sweets'),
  get: (id) => transport.get(`/sweets/${id}`),
  create: (data) => transport.post('/sweets', data),
  update: (id, data) => transport.put(`/sweets/${id}`, data),
  delete: (id) => transport.delete(`/sweets/${id}`),
}

export const salesApi = {
  getAll: () => transport.get('/sales'),
  get: (id) => transport.get(`/sales/${id}`),
  create: (data) => transport.post('/sales', data),
  update: (id, data) => transport.put(`/sales/${id}`, data),
  delete: (id) => transport.delete(`/sales/${id}`),
}

export const expensesApi = {
  getAll: () => transport.get('/expenses'),
  get: (id) => transport.get(`/expenses/${id}`),
  create: (data) => transport.post('/expenses', data),
  update: (id, data) => transport.put(`/expenses/${id}`, data),
  delete: (id) => transport.delete(`/expenses/${id}`),
}

export const dashboardApi = {
  get: () => transport.get('/dashboard'),
}

export const recipesApi = {
  addBrownies: () => transport.post('/recipes/brownies'),
}

export default transport
