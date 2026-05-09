import { useEffect, useState } from 'react'
import { salesApi, sweetsApi } from '../api'

const today = () => new Date().toISOString().split('T')[0]
const money = (value) => `R$ ${Number(value || 0).toFixed(2)}`
const formatDate = (value) => {
  const datePart = String(value || '').split('T')[0]
  const [year, month, day] = datePart.split('-')
  return year && month && day ? `${day}/${month}/${year}` : '-'
}

const baseForm = {
  sweet_id: '',
  quantity: 1,
  customer_name: '',
  discount: 0,
  surcharge: 0,
  payment_method: 'Pix',
  status: 'Pago',
  notes: '',
  date: today(),
}

export function SalesScreen() {
  const [sales, setSales] = useState([])
  const [sweets, setSweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(baseForm)

  const loadData = async () => {
    try {
      setLoading(true)
      const [salesRes, sweetsRes] = await Promise.all([salesApi.getAll(), sweetsApi.getAll()])
      setSales(salesRes.data)
      setSweets(sweetsRes.data)
      if (sweetsRes.data.length > 0 && !editingId) {
        setFormData((current) => ({ ...current, sweet_id: current.sweet_id || sweetsRes.data[0].id }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...formData,
      sweet_id: Number(formData.sweet_id),
      quantity: Number(formData.quantity),
      discount: Number(formData.discount),
      surcharge: Number(formData.surcharge),
      date: new Date(formData.date).toISOString(),
    }

    try {
      setError('')
      if (editingId) {
        await salesApi.update(editingId, payload)
      } else {
        await salesApi.create(payload)
      }
      resetForm()
      loadData()
    } catch (error) {
      setError(error?.response?.data?.error || error?.message || 'Erro ao salvar venda')
      console.error('Erro ao salvar venda:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar esta venda?')) {
      try {
        await salesApi.delete(id)
        loadData()
      } catch (error) {
        console.error('Erro ao deletar venda:', error)
      }
    }
  }

  const handleEdit = (sale) => {
    setFormData({
      sweet_id: sale.sweet_id,
      quantity: sale.quantity,
      customer_name: sale.customer_name,
      discount: sale.discount,
      surcharge: sale.surcharge,
      payment_method: sale.payment_method,
      status: sale.status,
      notes: sale.notes || '',
      date: sale.date.split('T')[0],
    })
    setEditingId(sale.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ ...baseForm, sweet_id: sweets[0]?.id || '' })
    setEditingId(null)
    setShowForm(false)
  }

  const getSweet = (sweetId) => sweets.find((sweet) => Number(sweet.id) === Number(sweetId))

  const calculateTotal = (sale) => {
    const sweet = getSweet(sale.sweet_id)
    if (!sweet) return 0
    return Number(sweet.selling_price || 0) * Number(sale.quantity || 0) - Number(sale.discount || 0) + Number(sale.surcharge || 0)
  }

  if (loading) return <div className="loading">Carregando vendas...</div>

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">
          <h3>Vendas e pedidos</h3>
          <p>Registre clientes, pagamento, status e total de cada venda.</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))} type="button">
          {showForm ? 'Cancelar' : 'Nova venda'}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          {error && <div className="notice error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Doce</label>
                <select value={formData.sweet_id} onChange={(event) => updateField('sweet_id', event.target.value)} required>
                  <option value="">Selecione um doce</option>
                  {sweets.map((sweet) => <option key={sweet.id} value={sweet.id}>{sweet.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Cliente</label>
                <input value={formData.customer_name} onChange={(event) => updateField('customer_name', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input type="number" min="1" value={formData.quantity} onChange={(event) => updateField('quantity', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={formData.date} onChange={(event) => updateField('date', event.target.value)} required />
              </div>
              <div className="form-group">
                <label>Desconto</label>
                <input type="number" min="0" step="0.01" value={formData.discount} onChange={(event) => updateField('discount', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Acrescimo</label>
                <input type="number" min="0" step="0.01" value={formData.surcharge} onChange={(event) => updateField('surcharge', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Pagamento</label>
                <select value={formData.payment_method} onChange={(event) => updateField('payment_method', event.target.value)}>
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Cartao</option>
                  <option>Boleto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(event) => updateField('status', event.target.value)}>
                  <option>Pago</option>
                  <option>Pendente</option>
                  <option>Cancelado</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Notas</label>
                <textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} rows="3" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={resetForm} type="button">Cancelar</button>
              <button className="btn btn-primary" type="submit">{editingId ? 'Atualizar venda' : 'Salvar venda'}</button>
            </div>
          </form>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="empty-state">
          <div>
            <h3>Nenhuma venda registrada</h3>
            <p>Cadastre uma venda para acompanhar a receita.</p>
          </div>
        </div>
      ) : (
        <div className="list-grid">
          {sales.map((sale) => {
            const sweet = getSweet(sale.sweet_id)
            const statusClass = sale.status === 'Pago' ? 'success' : sale.status === 'Cancelado' ? 'danger' : 'warning'

            return (
              <article key={sale.id} className="card">
                <div className="card-header">
                  <div>
                    <h3>{sweet?.name || 'Doce desconhecido'}</h3>
                    <span className={`badge ${statusClass}`}>{sale.status}</span>
                  </div>
                  <strong>{money(calculateTotal(sale))}</strong>
                </div>
                <div className="card-content">
                  <div className="detail"><span>Cliente</span><strong>{sale.customer_name}</strong></div>
                  <div className="detail"><span>Quantidade</span><strong>{sale.quantity} un.</strong></div>
                  <div className="detail"><span>Pagamento</span><strong>{sale.payment_method}</strong></div>
                  <div className="detail"><span>Data</span><strong>{formatDate(sale.date)}</strong></div>
                </div>
                {sale.notes && <p className="metric-subtext">{sale.notes}</p>}
                <div className="card-actions">
                  <span className="metric-subtext">Desconto {money(sale.discount)} | Acrescimo {money(sale.surcharge)}</span>
                  <div className="toolbar">
                    <button className="btn btn-secondary" onClick={() => handleEdit(sale)} type="button">Editar</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(sale.id)} type="button">Deletar</button>
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
