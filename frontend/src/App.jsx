import { useState } from 'react'
import RegisterTab from './components/RegisterTab'
import LoginTab from './components/LoginTab'
import './App.css'

// SVG Icons for tabs
const RegisterIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
)

const LoginIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const LockIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

function App() {
  const [activeTab, setActiveTab] = useState('register')

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="app-logo"><LockIcon size={28} /></div>
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
            <RegisterIcon />
            Đăng ký
          </button>
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            <LoginIcon />
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
