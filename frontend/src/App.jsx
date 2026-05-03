import { useState } from 'react'
import { DashboardScreen } from './screens/DashboardScreen'
import { SweetsScreen } from './screens/SweetsScreen'
import { SalesScreen } from './screens/SalesScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import './index.css'

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
    <div className="container">
      <div className="header">
        <h1>🍰 Doces da Bella</h1>
        <p>Controle de Orçamento e Vendas</p>
      </div>

      <nav className="nav">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-tab ${currentScreen === 'sweets' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('sweets')}
          >
            🍪 Doces
          </button>
          <button
            className={`nav-tab ${currentScreen === 'sales' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('sales')}
          >
            💰 Vendas
          </button>
          <button
            className={`nav-tab ${currentScreen === 'expenses' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('expenses')}
          >
            📉 Despesas
          </button>
        </div>
      </nav>

      <div className="content">
        {renderScreen()}
      </div>
    </div>
  )
}

export default App
