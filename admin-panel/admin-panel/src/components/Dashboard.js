import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import {
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Users,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard({ admin, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ADMIN_ENDPOINTS.dashboardStats);
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p className="font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="font-medium mb-4">{error}</p>
        <button onClick={fetchStats} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Reports',
      value: stats?.reports?.total || 0,
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Spam Reports',
      value: stats?.reports?.spam || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Inappropriate',
      value: stats?.reports?.inappropriate || 0,
      icon: ShieldAlert,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Normal Reports',
      value: stats?.reports?.normal || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending Researchers',
      value: stats?.researchers?.pending || 0,
      icon: UserPlus,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      onClick: () => onNavigate && onNavigate('researchers'),
    },
    {
      label: 'Verified Researchers',
      value: stats?.researchers?.verified || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => onNavigate && onNavigate('researchers'),
    },
    {
      label: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Overview</h2>
          <p className="text-slate-500 text-sm">Real-time statistics and activity summary</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={card.label}
              className={`card p-6 flex items-start gap-4 ${card.onClick ? 'cursor-pointer hover:bg-slate-100' : ''}`}
              onClick={card.onClick}
            >
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-slate-800">{card.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl">
            💡
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Quick Tip</h3>
            <p className="text-slate-600 text-sm">
              Use the sidebar to navigate between different management sections.
              The system automatically flags suspicious content for your review.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
