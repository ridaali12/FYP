import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ResearcherVerification from './components/ResearcherVerification';
import ReportManagement from './components/ReportManagement';
import UserManagement from './components/UserManagement';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdmin(adminData);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('admin');
      }
    }
  }, []);

  const handleLogin = (adminData) => {
    setAdmin(adminData);
    setIsAuthenticated(true);
    localStorage.setItem('admin', JSON.stringify(adminData));
  };

  const handleLogout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'researchers', label: 'Researchers', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar text-white transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-xl">
            🦌
          </div>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight"
            >
              WildlynNorth
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-button ${
                  isActive ? 'nav-button-active' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-white' : 'group-hover:text-white'}
                />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <ChevronRight size={16} className="ml-auto opacity-50" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-semibold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{admin.username}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                {admin.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard admin={admin} onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === 'reports' && <ReportManagement admin={admin} />}
              {activeTab === 'users' && <UserManagement admin={admin} />}
              {activeTab === 'researchers' && <ResearcherVerification admin={admin} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
