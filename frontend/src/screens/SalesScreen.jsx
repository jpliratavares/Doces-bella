import { useState, useEffect } from 'react'
import { salesApi, sweetsApi } from '../api'

export function SalesScreen() {
  const [sales, setSales] = useState([])
  const [sweets, setSweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    sweet_id: '',
    quantity: 1,
    customer_name: '',
    discount: 0,
    surcharge: 0,
    payment_method: 'Pix',
    status: 'Pago',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [salesRes, sweetsRes] = await Promise.all([
        salesApi.getAll(),
        sweetsApi.getAll(),
      ])
      setSales(salesRes.data)
      setSweets(sweetsRes.data)
      if (sweetsRes.data.length > 0 && !editingId) {
        setFormData((prev) => ({ ...prev, sweet_id: sweetsRes.data[0].id }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        sweet_id: parseInt(formData.sweet_id),
        date: new Date(formData.date).toISOString(),
      }
      if (editingId) {
        await salesApi.update(editingId, dataToSend)
      } else {
        await salesApi.create(dataToSend)
      }
      resetForm()
      loadData()
    } catch (error) {
      console.error('Erro ao salvar venda:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza?')) {
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
      notes: sale.notes,
      date: sale.date.split('T')[0],
    })
    setEditingId(sale.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      sweet_id: sweets[0]?.id || '',
      quantity: 1,
      customer_name: '',
      discount: 0,
      surcharge: 0,
      payment_method: 'Pix',
      status: 'Pago',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getSweetName = (sweetId) => {
    const sweet = sweets.find((s) => s.id === sweetId)
    return sweet?.name || 'Desconhecido'
  }

  const calculateTotal = (sale) => {
    const sweet = sweets.find((s) => s.id === sale.sweet_id)
    if (!sweet) return 0
    return sweet.selling_price * sale.quantity - sale.discount + sale.surcharge
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nova Venda'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingId ? 'Editar Venda' : 'Nova Venda'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Doce</label>
              <select
                value={formData.sweet_id}
                onChange={(e) => setFormData({ ...formData, sweet_id: e.target.value })}
                required
              >
                <option value="">Selecione um doce</option>
                {sweets.map((sweet) => (
                  <option key={sweet.id} value={sweet.id}>
                    {sweet.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Quantidade</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
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
            <div className="form-group">
              <label>Cliente</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Acréscimo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.surcharge}
                  onChange={(e) => setFormData({ ...formData, surcharge: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Forma de Pagamento</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Cartão</option>
                  <option>Boleto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option>Pago</option>
                  <option>Pendente</option>
                  <option>Cancelado</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma venda registrada!</p>
        </div>
      ) : (
        <div>
          {sales.map((sale) => (
            <div key={sale.id} className="card">
              <h3>{getSweetName(sale.sweet_id)}</h3>
              <div className="card-content">
                <p><strong>Cliente:</strong> {sale.customer_name}</p>
                <p><strong>Quantidade:</strong> {sale.quantity} unidades</p>
                <p><strong>Total:</strong> R$ {calculateTotal(sale).toFixed(2)}</p>
                <p><strong>Forma de Pagamento:</strong> {sale.payment_method}</p>
                <p><strong>Status:</strong> {sale.status}</p>
                {sale.notes && <p><strong>Notas:</strong> {sale.notes}</p>}
              </div>
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(sale)}>
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(sale.id)}>
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
