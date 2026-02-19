import { useState } from 'react'
import RegisterTab from './components/RegisterTab'
import LoginTab from './components/LoginTab'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('register')

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="app-logo">🔐</div>
        <h1 className="app-title">Face ID Login</h1>
        <p className="app-subtitle">Đăng nhập an toàn bằng khuôn mặt</p>
      </div>

      {/* Card */}
      <div className="card">
        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <span className="icon">📝</span>
            Đăng ký
          </button>
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            <span className="icon">👤</span>
            Đăng nhập
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content" key={activeTab}>
          {activeTab === 'register' ? <RegisterTab /> : <LoginTab />}
        </div>
      </div>
    </div>
  )
}

export default App
