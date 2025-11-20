import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

// 页面组件
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePage from './pages/CreatePage';
import CreateWizard from './pages/CreateWizard';
import DashboardPage from './pages/DashboardPage';
import RechargePage from './pages/RechargePage';
import CreditsPage from './pages/CreditsPage';
import AdminPage from './pages/AdminPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// 布局组件
import Navbar from './components/Navbar';

// Context
import { AuthProvider } from './utils/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen relative overflow-hidden">
          {/* 浮动装饰元素 */}
          <div className="floating-dot w-20 h-20 bg-purple-300/30 top-10 left-10" style={{ animationDelay: '0s' }} />
          <div className="floating-dot w-32 h-32 bg-pink-300/20 top-1/4 right-20" style={{ animationDelay: '1s' }} />
          <div className="floating-dot w-16 h-16 bg-blue-300/25 bottom-20 left-1/4" style={{ animationDelay: '2s' }} />
          <div className="floating-dot w-24 h-24 bg-yellow-300/20 bottom-32 right-1/3" style={{ animationDelay: '1.5s' }} />
          
          <Navbar />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/create-wizard" element={<CreateWizard />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recharge" element={<RechargePage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
