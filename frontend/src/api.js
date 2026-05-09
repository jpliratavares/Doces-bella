import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const storageKey = 'doces-bella-local-db-v1'
const backupStorageKey = `${storageKey}-backup`

const browserAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const emptyState = () => ({
  sweets: [],
  sales: [],
  expenses: [],
  meta: {
    inventoryDebited: true,
  },
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

const debitExistingSalesFromInventory = (sweets, sales) => {
  const nextSweets = clone(sweets)

  sales.forEach((sale) => {
    const sweetIndex = nextSweets.findIndex((sweet) => Number(sweet.id) === Number(sale.sweet_id))
    if (sweetIndex >= 0) {
      nextSweets[sweetIndex] = {
        ...nextSweets[sweetIndex],
        quantity: Math.max(0, toNumber(nextSweets[sweetIndex].quantity) - normalizeSaleQuantity(sale.quantity)),
      }
    }
  })

  return nextSweets
}

const normalizeState = (value) => {
  const sales = Array.isArray(value?.sales) ? value.sales : []
  const expenses = Array.isArray(value?.expenses) ? value.expenses : []
  const sourceSweets = Array.isArray(value?.sweets) ? value.sweets : []
  const inventoryDebited = value?.meta?.inventoryDebited === true

  return {
    sweets: inventoryDebited ? sourceSweets : debitExistingSalesFromInventory(sourceSweets, sales),
    sales,
    expenses,
    meta: {
      ...(typeof value?.meta === 'object' && value?.meta ? value.meta : {}),
      inventoryDebited: true,
    },
  }
}

const parseStoredState = (value) => {
  if (!value) return null
  try {
    return normalizeState(JSON.parse(value))
  } catch {
    return null
  }
}

const needsInventoryMigration = (value) => {
  if (!value) return false
  try {
    return JSON.parse(value)?.meta?.inventoryDebited !== true
  } catch {
    return false
  }
}

const loadState = () => {
  if (!browserAvailable) {
    return memoryState
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey)
    const storedState = parseStoredState(storedValue)
    if (storedState) {
      if (needsInventoryMigration(storedValue)) {
        saveState(storedState)
      }
      return storedState
    }

    const backupValue = window.localStorage.getItem(backupStorageKey)
    const backupState = parseStoredState(backupValue)
    if (backupState) {
      saveState(backupState)
      return backupState
    }

    return memoryState
  } catch {
    return memoryState
  }
}

const saveState = (nextState) => {
  memoryState = clone(nextState)

  if (!browserAvailable) {
    return
  }

  const serializedState = JSON.stringify(nextState)
  window.localStorage.setItem(backupStorageKey, serializedState)
  window.localStorage.setItem(storageKey, serializedState)
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

const normalizeSaleQuantity = (quantity) => Math.max(1, Math.trunc(toNumber(quantity) || 1))

const findSweetIndex = (state, sweetId) => {
  return state.sweets.findIndex((item) => Number(item.id) === Number(sweetId))
}

const removeFromStock = (state, sweetId, quantity) => {
  const sweetIndex = findSweetIndex(state, sweetId)
  if (sweetIndex === -1) {
    throw new Error('Doce nao encontrado')
  }

  const saleQuantity = normalizeSaleQuantity(quantity)
  const currentQuantity = toNumber(state.sweets[sweetIndex].quantity)

  if (currentQuantity < saleQuantity) {
    throw new Error('Estoque insuficiente para esta venda')
  }

  state.sweets[sweetIndex] = {
    ...state.sweets[sweetIndex],
    quantity: currentQuantity - saleQuantity,
  }
}

const restoreToStock = (state, sweetId, quantity) => {
  const sweetIndex = findSweetIndex(state, sweetId)
  if (sweetIndex === -1) return

  state.sweets[sweetIndex] = {
    ...state.sweets[sweetIndex],
    quantity: toNumber(state.sweets[sweetIndex].quantity) + normalizeSaleQuantity(quantity),
  }
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
        balance: totalSales - totalExpenses,
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

      const saleQuantity = normalizeSaleQuantity(payload.quantity)
      removeFromStock(state, sweetId, saleQuantity)

      const nextSale = {
        id: nextId(state.sales),
        sweet_id: sweetId,
        quantity: saleQuantity,
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

      const currentSale = state.sales[index]
      const nextSale = {
        ...currentSale,
        sweet_id: payload.sweet_id !== undefined ? Number(payload.sweet_id) : Number(currentSale.sweet_id),
        quantity: payload.quantity !== undefined ? normalizeSaleQuantity(payload.quantity) : normalizeSaleQuantity(currentSale.quantity),
        customer_name: payload.customer_name ?? currentSale.customer_name,
        discount: payload.discount !== undefined ? toNumber(payload.discount) : toNumber(currentSale.discount),
        surcharge: payload.surcharge !== undefined ? toNumber(payload.surcharge) : toNumber(currentSale.surcharge),
        payment_method: payload.payment_method ?? currentSale.payment_method,
        status: payload.status ?? currentSale.status,
        notes: payload.notes ?? currentSale.notes,
        date: payload.date ? normalizeDate(payload.date) : currentSale.date,
      }

      restoreToStock(state, currentSale.sweet_id, currentSale.quantity)
      removeFromStock(state, nextSale.sweet_id, nextSale.quantity)
      state.sales[index] = nextSale

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
      const sale = state.sales.find((item) => Number(item.id) === id)
      if (sale) {
        restoreToStock(state, sale.sweet_id, sale.quantity)
      }
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
