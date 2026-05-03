import { useState, useEffect } from 'react'
import { sweetsApi } from '../api'

export function SweetsScreen() {
  const [sweets, setSweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    form_name: '',
    category: 'Doce',
    cost_price: 0,
    selling_price: 0,
  })

  const loadSweets = async () => {
    try {
      setLoading(true)
      const response = await sweetsApi.getAll()
      setSweets(response.data)
    } catch (error) {
      console.error('Erro ao carregar doces:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSweets()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await sweetsApi.update(editingId, formData)
      } else {
        await sweetsApi.create(formData)
      }
      resetForm()
      loadSweets()
    } catch (error) {
      console.error('Erro ao salvar doce:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza?')) {
      try {
        await sweetsApi.delete(id)
        loadSweets()
      } catch (error) {
        console.error('Erro ao deletar doce:', error)
      }
    }
  }

  const handleEdit = (sweet) => {
    setFormData({
      name: sweet.name,
      form_name: sweet.form_name,
      category: sweet.category,
      cost_price: sweet.cost_price,
      selling_price: sweet.selling_price,
    })
    setEditingId(sweet.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      form_name: '',
      category: 'Doce',
      cost_price: 0,
      selling_price: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Doce'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingId ? 'Editar Doce' : 'Novo Doce'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Forma/Molde</label>
              <input
                type="text"
                value={formData.form_name}
                onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Preço Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Preço Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      {sweets.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum doce cadastrado ainda!</p>
        </div>
      ) : (
        <div>
          {sweets.map((sweet) => (
            <div key={sweet.id} className="card">
              <h3>{sweet.name}</h3>
              <div className="card-content">
                <p><strong>Categoria:</strong> {sweet.category}</p>
                <p><strong>Forma:</strong> {sweet.form_name || '-'}</p>
                <p><strong>Custo:</strong> R$ {sweet.cost_price.toFixed(2)}</p>
                <p><strong>Venda:</strong> R$ {sweet.selling_price.toFixed(2)}</p>
                <p><strong>Margem:</strong> R$ {(sweet.selling_price - sweet.cost_price).toFixed(2)} ({(((sweet.selling_price - sweet.cost_price) / sweet.cost_price) * 100).toFixed(1)}%)</p>
              </div>
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(sweet)}>
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(sweet.id)}>
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
