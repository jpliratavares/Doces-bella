import { supabase } from './supabaseClient'

export const sweetsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('sweets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data }
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('sweets')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return { data }
  },

  create: async (sweet) => {
    const { data, error } = await supabase
      .from('sweets')
      .insert([{
        name: sweet.name,
        form_name: sweet.form_name,
        category: sweet.category,
        cost_price: sweet.cost_price,
        selling_price: sweet.selling_price,
        quantity: sweet.quantity || 0
      }])
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  update: async (id, sweet) => {
    const { data, error } = await supabase
      .from('sweets')
      .update(sweet)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('sweets')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

export const salesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data }
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return { data }
  },

  create: async (sale) => {
    const { data, error } = await supabase
      .from('sales')
      .insert([{
        sweet_id: sale.sweet_id,
        quantity: sale.quantity,
        customer_name: sale.customer_name,
        discount: sale.discount || 0,
        surcharge: sale.surcharge || 0,
        payment_method: sale.payment_method,
        status: sale.status,
        notes: sale.notes,
        date: sale.date
      }])
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  update: async (id, sale) => {
    const { data, error } = await supabase
      .from('sales')
      .update(sale)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

export const expensesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data }
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return { data }
  },

  create: async (expense) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        type: expense.type,
        date: expense.date
      }])
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  update: async (id, expense) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

export const dashboardApi = {
  get: async () => {
    // Get all data
    const { data: sweets } = await supabase.from('sweets').select('*')
    const { data: sales } = await supabase.from('sales').select('*')
    const { data: expenses } = await supabase.from('expenses').select('*')

    // Calculate totals
    const sweets_count = sweets?.length || 0
    const sales_count = sales?.length || 0
    const expenses_count = expenses?.length || 0
    const total_quantity = sweets?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0

    let total_sales = 0
    let total_expenses = 0

    if (sales) {
      for (const sale of sales) {
        const sweet = sweets?.find(s => s.id === sale.sweet_id)
        if (sweet) {
          total_sales += (sweet.selling_price * sale.quantity - sale.discount + sale.surcharge)
        }
      }
    }

    if (expenses) {
      total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    }

    const balance = total_sales + total_expenses

    return {
      data: {
        sweets_count,
        sales_count,
        expenses_count,
        total_sales,
        total_expenses,
        balance,
        total_quantity
      }
    }
  }
}

export const recipesApi = {
  addBrownies: async () => {
    // Create -16 expense
    await expensesApi.create({
      description: 'Receita: Brownies',
      amount: -16,
      category: 'Ingredientes',
      type: 'Fixo',
      date: new Date().toISOString().split('T')[0]
    })

    // Check if brownie already exists
    const { data: brownies } = await supabase
      .from('sweets')
      .select('*')
      .eq('name', 'Brownie')
      .limit(1)

    if (brownies && brownies.length > 0) {
      // Update quantity
      await sweetsApi.update(brownies[0].id, {
        quantity: (brownies[0].quantity || 0) + 12
      })
    } else {
      // Create new brownie
      await sweetsApi.create({
        name: 'Brownie',
        form_name: 'Unidade',
        category: 'Chocolate',
        cost_price: 2,
        selling_price: 4,
        quantity: 12
      })
    }

    return { success: true }
  }
}
