import { useEffect, useState } from 'react'
import { expensesApi, recipesApi } from '../api'

const today = () => new Date().toISOString().split('T')[0]
const money = (value) => `R$ ${Number(value || 0).toFixed(2)}`
const formatDate = (value) => {
  const datePart = String(value || '').split('T')[0]
  const [year, month, day] = datePart.split('-')
  return year && month && day ? `${day}/${month}/${year}` : '-'
}

const baseForm = {
  description: '',
  amount: 0,
  category: 'Geral',
  type: 'Variavel',
  date: today(),
}

export function ExpensesScreen() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(baseForm)

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

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...formData,
      amount: Number(formData.amount),
      date: new Date(formData.date).toISOString(),
    }

    try {
      if (editingId) {
        await expensesApi.update(editingId, payload)
      } else {
        await expensesApi.create(payload)
      }
      resetForm()
      loadExpenses()
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este lancamento?')) {
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
    setFormData(baseForm)
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

  if (loading) return <div className="loading">Carregando despesas...</div>

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">
          <h3>Despesas e producao</h3>
          <p>Registre custos fixos, variaveis e receitas de producao.</p>
        </div>
        <div className="toolbar">
          <button className="btn btn-secondary" onClick={addQuickReceipt} type="button">Receita brownie</button>
          <button className="btn btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))} type="button">
            {showForm ? 'Cancelar' : 'Nova despesa'}
          </button>
        </div>
      </div>

      <div className="financial-grid">
        <article className={`metric-card ${totalExpenses >= 0 ? 'negative' : 'positive'}`}>
          <p className="metric-label">Total lancado</p>
          <p className="metric-value">{money(totalExpenses)}</p>
          <p className="metric-subtext">Soma dos custos e receitas cadastrados</p>
        </article>
      </div>

      {showForm && (
        <div className="panel">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Descricao</label>
                <input value={formData.description} onChange={(event) => updateField('description', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Valor</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(event) => updateField('amount', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={formData.category} onChange={(event) => updateField('category', event.target.value)}>
                  <option>Geral</option>
                  <option>Ingredientes</option>
                  <option>Embalagem</option>
                  <option>Logistica</option>
                  <option>Receita</option>
                  <option>Outros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={formData.type} onChange={(event) => updateField('type', event.target.value)}>
                  <option>Fixo</option>
                  <option>Variavel</option>
                </select>
              </div>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={formData.date} onChange={(event) => updateField('date', event.target.value)} required />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={resetForm} type="button">Cancelar</button>
              <button className="btn btn-primary" type="submit">{editingId ? 'Atualizar lancamento' : 'Salvar lancamento'}</button>
            </div>
          </form>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="empty-state">
          <div>
            <h3>Nenhuma despesa registrada</h3>
            <p>Adicione um custo para acompanhar o resultado.</p>
          </div>
        </div>
      ) : (
        <div className="list-grid">
          {expenses.map((expense) => {
            const isIncome = Number(expense.amount || 0) < 0 || expense.category === 'Receita'

            return (
              <article key={expense.id} className="card">
                <div className="card-header">
                  <div>
                    <h3>{expense.description}</h3>
                    <span className={`badge ${isIncome ? 'success' : 'warning'}`}>{expense.category}</span>
                  </div>
                  <strong>{money(expense.amount)}</strong>
                </div>
                <div className="card-content">
                  <div className="detail"><span>Tipo</span><strong>{expense.type}</strong></div>
                  <div className="detail"><span>Data</span><strong>{formatDate(expense.date)}</strong></div>
                  <div className="detail"><span>Natureza</span><strong>{isIncome ? 'Receita' : 'Despesa'}</strong></div>
                </div>
                <div className="card-actions">
                  <span className="metric-subtext">Lancamento financeiro do controle de producao.</span>
                  <div className="toolbar">
                    <button className="btn btn-secondary" onClick={() => handleEdit(expense)} type="button">Editar</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(expense.id)} type="button">Deletar</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
