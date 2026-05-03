import { useState, useEffect } from 'react'
import { expensesApi, recipesApi } from '../api'

export function ExpensesScreen() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'Geral',
    type: 'Variável',
    date: new Date().toISOString().split('T')[0],
  })

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const response = await expensesApi.getAll()
      setExpenses(response.data)
    } catch (error) {
      console.error('Erro ao carregar despesas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      }
      if (editingId) {
        await expensesApi.update(editingId, dataToSend)
      } else {
        await expensesApi.create(dataToSend)
      }
      resetForm()
      loadExpenses()
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza?')) {
      try {
        await expensesApi.delete(id)
        loadExpenses()
      } catch (error) {
        console.error('Erro ao deletar despesa:', error)
      }
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      type: expense.type,
      date: expense.date.split('T')[0],
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: 'Geral',
      type: 'Variável',
      date: new Date().toISOString().split('T')[0],
    })
    setEditingId(null)
    setShowForm(false)
  }

  const addQuickReceipt = async () => {
    try {
      await recipesApi.addBrownies()
      loadExpenses()
    } catch (error) {
      console.error('Erro ao adicionar receita:', error)
    }
  }

  if (loading) return <div className="loading">Carregando...</div>

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nova Despesa'}
        </button>
        <button className="btn btn-secondary" onClick={addQuickReceipt}>
          ✅ Adicionar Receita (R$ 16,00)
        </button>
      </div>

      <div className="dashboard" style={{ marginBottom: '20px' }}>
        <div className="dashboard-card">
          <p>Total de Despesas</p>
          <h3>R$ {totalExpenses.toFixed(2)}</h3>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option>Geral</option>
                  <option>Ingredientes</option>
                  <option>Embalagem</option>
                  <option>Logística</option>
                  <option>Outros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option>Fixo</option>
                  <option>Variável</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma despesa registrada!</p>
        </div>
      ) : (
        <div>
          {expenses.map((expense) => (
            <div key={expense.id} className="card">
              <h3>{expense.description}</h3>
              <div className="card-content">
                <p><strong>Valor:</strong> R$ {expense.amount.toFixed(2)}</p>
                <p><strong>Categoria:</strong> {expense.category}</p>
                <p><strong>Tipo:</strong> {expense.type}</p>
                <p><strong>Data:</strong> {new Date(expense.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(expense)}>
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(expense.id)}>
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
