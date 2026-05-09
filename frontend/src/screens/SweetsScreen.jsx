import { useEffect, useState } from 'react'
import { sweetsApi } from '../api'

const emptyForm = {
  name: '',
  form_name: '',
  category: 'Doce',
  cost_price: 0,
  selling_price: 0,
  quantity: 0,
}

const money = (value) => `R$ ${Number(value || 0).toFixed(2)}`

export function SweetsScreen() {
  const [sweets, setSweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

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

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...formData,
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
      quantity: Number(formData.quantity),
    }

    try {
      if (editingId) {
        await sweetsApi.update(editingId, payload)
      } else {
        await sweetsApi.create(payload)
      }
      resetForm()
      loadSweets()
    } catch (error) {
      console.error('Erro ao salvar doce:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este doce?')) {
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
      form_name: sweet.form_name || '',
      category: sweet.category || 'Doce',
      cost_price: sweet.cost_price || 0,
      selling_price: sweet.selling_price || 0,
      quantity: sweet.quantity || 0,
    })
    setEditingId(sweet.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div className="loading">Carregando doces...</div>

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">
          <h3>Catalogo de doces</h3>
          <p>Controle preco, margem e estoque disponivel para venda.</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))} type="button">
          {showForm ? 'Cancelar' : 'Novo doce'}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nome</label>
                <input value={formData.name} onChange={(event) => updateField('name', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Forma ou molde</label>
                <input value={formData.form_name} onChange={(event) => updateField('form_name', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input value={formData.category} onChange={(event) => updateField('category', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Estoque</label>
                <input type="number" min="0" value={formData.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Preco de custo</label>
                <input type="number" min="0" step="0.01" value={formData.cost_price} onChange={(event) => updateField('cost_price', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Preco de venda</label>
                <input type="number" min="0" step="0.01" value={formData.selling_price} onChange={(event) => updateField('selling_price', event.target.value)} required />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={resetForm} type="button">Cancelar</button>
              <button className="btn btn-primary" type="submit">{editingId ? 'Atualizar doce' : 'Salvar doce'}</button>
            </div>
          </form>
        </div>
      )}

      {sweets.length === 0 ? (
        <div className="empty-state">
          <div>
            <h3>Nenhum doce cadastrado</h3>
            <p>Adicione o primeiro item para iniciar o controle.</p>
          </div>
        </div>
      ) : (
        <div className="list-grid">
          {sweets.map((sweet) => {
            const margin = Number(sweet.selling_price || 0) - Number(sweet.cost_price || 0)
            const marginPercent = Number(sweet.cost_price) > 0 ? (margin / Number(sweet.cost_price)) * 100 : 0

            return (
              <article key={sweet.id} className="card">
                <div className="card-header">
                  <div>
                    <h3>{sweet.name}</h3>
                    <span className="badge warning">{sweet.category || 'Doce'}</span>
                  </div>
                  <span className={`badge ${(sweet.quantity || 0) > 0 ? 'success' : 'danger'}`}>
                    {sweet.quantity || 0} em estoque
                  </span>
                </div>
                <div className="card-content">
                  <div className="detail"><span>Forma</span><strong>{sweet.form_name || '-'}</strong></div>
                  <div className="detail"><span>Custo</span><strong>{money(sweet.cost_price)}</strong></div>
                  <div className="detail"><span>Venda</span><strong>{money(sweet.selling_price)}</strong></div>
                  <div className="detail"><span>Margem</span><strong>{money(margin)} ({marginPercent.toFixed(1)}%)</strong></div>
                </div>
                <div className="card-actions">
                  <span className="metric-subtext">Atualize o estoque antes de registrar novas vendas.</span>
                  <div className="toolbar">
                    <button className="btn btn-secondary" onClick={() => handleEdit(sweet)} type="button">Editar</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(sweet.id)} type="button">Deletar</button>
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
