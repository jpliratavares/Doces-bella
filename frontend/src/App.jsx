import { useState } from 'react'
import { DashboardScreen } from './screens/DashboardScreen'
import { SweetsScreen } from './screens/SweetsScreen'
import { SalesScreen } from './screens/SalesScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import './index.css'

const screens = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Resumo geral' },
  { id: 'sweets', label: 'Doces', hint: 'Catalogo e estoque' },
  { id: 'sales', label: 'Vendas', hint: 'Pedidos e receita' },
  { id: 'expenses', label: 'Despesas', hint: 'Custos e receitas' },
]

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard')

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />
      case 'sweets':
        return <SweetsScreen />
      case 'sales':
        return <SalesScreen />
      case 'expenses':
        return <ExpensesScreen />
      default:
        return <DashboardScreen />
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DB</div>
          <div>
            <h1>Doces da Bella</h1>
            <p>Controle de doces</p>
          </div>
        </div>

        <nav className="nav" aria-label="Navegacao principal">
          {screens.map((screen) => (
            <button
              key={screen.id}
              className={`nav-tab ${currentScreen === screen.id ? 'active' : ''}`}
              onClick={() => setCurrentScreen(screen.id)}
              type="button"
            >
              <span>{screen.label}</span>
              <small>{screen.hint}</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Painel operacional</p>
            <h2>{screens.find((screen) => screen.id === currentScreen)?.label}</h2>
          </div>
          <div className="status-pill">
            <span className="pulse" />
            Atualizacao local ativa
          </div>
        </header>

        <section className="content">{renderScreen()}</section>
      </main>
    </div>
  )
}

export default App
