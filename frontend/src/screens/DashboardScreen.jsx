import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'

const money = (value) => `R$ ${Number(value || 0).toFixed(2)}`

export function DashboardScreen() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    try {
      const response = await dashboardApi.get()
      setDashboard(response.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !dashboard) {
    return <div className="loading">Carregando indicadores...</div>
  }

  const balanceClass = dashboard.balance >= 0 ? 'positive' : 'negative'

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">
          <h3>Resumo em tempo real</h3>
          <p>Acompanhe estoque, vendas, despesas e saldo atualizado.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card">
          <p className="metric-label">Doces cadastrados</p>
          <p className="metric-value">{dashboard.sweets_count}</p>
          <p className="metric-subtext">Itens no catalogo</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Vendas registradas</p>
          <p className="metric-value">{dashboard.sales_count}</p>
          <p className="metric-subtext">Pedidos no historico</p>
        </article>
        <article className="metric-card accent">
          <p className="metric-label">Estoque total</p>
          <p className="metric-value">{dashboard.total_quantity}</p>
          <p className="metric-subtext">Unidades disponiveis</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Lancamentos</p>
          <p className="metric-value">{dashboard.expenses_count}</p>
          <p className="metric-subtext">Custos e receitas</p>
        </article>
      </div>

      <div className="financial-grid">
        <article className="metric-card positive">
          <p className="metric-label">Total vendido</p>
          <p className="metric-value">{money(dashboard.total_sales)}</p>
          <p className="metric-subtext">Receita bruta registrada</p>
        </article>
        <article className="metric-card negative">
          <p className="metric-label">Total de despesas</p>
          <p className="metric-value">{money(dashboard.total_expenses)}</p>
          <p className="metric-subtext">Saidas e custos de producao</p>
        </article>
        <article className={`metric-card ${balanceClass}`}>
          <p className="metric-label">Saldo</p>
          <p className="metric-value">{money(dashboard.balance)}</p>
          <p className="metric-subtext">Resultado consolidado</p>
        </article>
      </div>
    </>
  )
}
