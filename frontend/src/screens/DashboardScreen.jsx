import { useState, useEffect } from 'react'
import { dashboardApi } from '../api'

export function DashboardScreen() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await dashboardApi.get()
      setDashboard(response.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !dashboard) return <div className="loading">Carregando...</div>

  const balanceColor = dashboard.balance >= 0 ? '#16a34a' : '#f43f5e'

  return (
    <div>
      <h2 style={{ color: '#be185d', marginBottom: '24px' }}>Resumo</h2>
      
      <div className="dashboard">
        <div className="dashboard-card">
          <p>Total de Doces</p>
          <h3>{dashboard.sweets_count}</h3>
        </div>
        
        <div className="dashboard-card">
          <p>Total de Vendas</p>
          <h3>{dashboard.sales_count}</h3>
        </div>
        
        <div className="dashboard-card">
          <p>Estoque Total</p>
          <h3>{dashboard.total_quantity}</h3>
        </div>
        
        <div className="dashboard-card">
          <p>Total de Despesas</p>
          <h3>{dashboard.expenses_count}</h3>
        </div>
      </div>

      <div className="dashboard">
        <div style={{ background: '#16a34a', color: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <p>Total de Vendas</p>
          <h3>R$ {dashboard.total_sales.toFixed(2)}</h3>
        </div>

        <div style={{ background: '#f43f5e', color: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <p>Total de Despesas</p>
          <h3>R$ {dashboard.total_expenses.toFixed(2)}</h3>
        </div>

        <div style={{ background: balanceColor, color: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <p>Saldo</p>
          <h3>R$ {dashboard.balance.toFixed(2)}</h3>
        </div>
      </div>
    </div>
  )
}
