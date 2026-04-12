import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import {
  BarChart3, AlertTriangle, ShieldAlert, CheckCircle2,
  UserPlus, Users, RefreshCw, TrendingUp, TrendingDown,
  Activity, Clock, Zap, FileText, Eye, Flag, Trash2,
  ChevronRight, ArrowUpRight, Wifi, Database, Server,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── tiny hook: animated counter ─── */
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── SVG Bar Chart ─── */
function MiniBarChart({ data, color = '#16a34a' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 280, H = 80, barW = 28, gap = 8;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * H);
        const x = i * (barW + gap);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={H} width={barW} height={4} rx="2" fill="#e5ede9" />
            <motion.rect
              x={x} y={y} width={barW} rx="4"
              fill={d.highlight ? color : `${color}55`}
              initial={{ height: 0, y: H }}
              animate={{ height: barH, y }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
            />
            <text x={x + barW / 2} y={H + 18} textAnchor="middle"
              fontSize="10" fill="#9ca3af" fontFamily="DM Sans, sans-serif">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Circular Progress ─── */
function CircleProgress({ value = 0, max = 100, size = 80, color = '#16a34a', label }) {
  const pct = max ? Math.min(value / max, 1) : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e5ede9" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={circ}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
          fontSize="14" fontWeight="700" fill="#0f1f17"
          fontFamily="DM Sans, sans-serif">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>{label}</span>}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ card, index }) {
  const Icon = card.icon;
  const TrendIcon = card.trend >= 0 ? TrendingUp : TrendingDown;
  const displayValue = useCountUp(card.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      onClick={card.onClick}
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '20px 22px',
        border: '1px solid #e5ede9',
        borderLeft: `3px solid ${card.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        cursor: card.onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.18s ease',
      }}
      whileHover={{ y: -3, boxShadow: '0 4px 8px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.10)' }}
    >
      {/* bg glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: card.border, opacity: 0.06,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          padding: '8px', borderRadius: 10,
          background: card.bgLight, color: card.border,
        }}>
          <Icon size={20} />
        </div>
        {card.trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            color: card.trend >= 0 ? '#16a34a' : '#ef4444',
            background: card.trend >= 0 ? '#dcfce7' : '#fee2e2',
            padding: '3px 7px', borderRadius: 99,
          }}>
            <TrendIcon size={10} />
            {Math.abs(card.trend)}%
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {card.label}
      </p>
      <p style={{ fontSize: 32, fontWeight: 800, color: '#0f1f17', lineHeight: 1 }}>
        {displayValue}
      </p>
      {card.onClick && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: card.border, fontWeight: 600 }}>
          View details <ArrowUpRight size={12} />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.07 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
        borderBottom: index < 4 ? '1px solid #f0f5f2' : 'none' }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: item.bg, color: item.color, fontSize: 14,
      }}>
        <item.icon size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 1 }}>{item.text}</p>
        <p style={{ fontSize: 11, color: '#9ca3af' }}>{item.time}</p>
      </div>
    </motion.div>
  );
}

/* ─── System Health Dot ─── */
function HealthDot({ label, status }) {
  const colors = { ok: '#16a34a', warn: '#f59e0b', error: '#ef4444' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: colors[status] || colors.ok,
        boxShadow: `0 0 0 3px ${colors[status] || colors.ok}30`,
        display: 'inline-block',
        animation: status === 'ok' ? 'pulse 2s ease infinite' : 'none',
      }} />
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════════ */
export default function Dashboard({ admin, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChart, setActiveChart] = useState('reports');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ADMIN_ENDPOINTS.dashboardStats);
      setStats(response.data);
      setError('');
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '3px solid #e5ede9', borderTopColor: '#16a34a',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 10,
            borderRadius: '50%', border: '2px solid #bbf7d0',
            borderTopColor: '#16a34a', opacity: 0.5,
            animation: 'spin 1.4s linear infinite reverse',
          }} />
        </div>
        <p style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>Loading dashboard…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={28} color="#ef4444" />
        </div>
        <p style={{ color: '#6b7280', fontWeight: 500 }}>{error}</p>
        <button onClick={fetchStats} style={{
          padding: '10px 24px', background: '#16a34a', color: 'white',
          border: 'none', borderRadius: 10, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
          boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
        }}>Retry</button>
      </div>
    );
  }

  /* ── Derived data ── */
  const total   = stats?.reports?.total || 0;
  const spam    = stats?.reports?.spam || 0;
  const inapp   = stats?.reports?.inappropriate || 0;
  const normal  = stats?.reports?.normal || 0;
  const pending = stats?.researchers?.pending || 0;
  const verified= stats?.researchers?.verified || 0;
  const totalUsers = stats?.users?.total || 0;
  const totalResearchers = pending + verified;

  const statCards = [
    { label: 'Total Reports',        value: total,   icon: BarChart3,    border: '#3b82f6', bgLight: '#eff6ff', trend: 12 },
    { label: 'Spam Reports',         value: spam,    icon: AlertTriangle,border: '#f59e0b', bgLight: '#fffbeb', trend: -3 },
    { label: 'Inappropriate',        value: inapp,   icon: ShieldAlert,  border: '#ef4444', bgLight: '#fef2f2', trend: 5 },
    { label: 'Normal Reports',       value: normal,  icon: CheckCircle2, border: '#16a34a', bgLight: '#f0fdf4', trend: 18 },
    { label: 'Pending Verification', value: pending, icon: UserPlus,     border: '#7c3aed', bgLight: '#f5f3ff', onClick: () => onNavigate && onNavigate('researchers') },
    { label: 'Verified Researchers', value: verified,icon: TrendingUp,   border: '#0891b2', bgLight: '#ecfeff', onClick: () => onNavigate && onNavigate('researchers') },
    { label: 'Total Users',          value: totalUsers,icon: Users,      border: '#64748b', bgLight: '#f8fafc' },
  ];

  const reportChartData = [
    { label: 'Normal',  value: normal,  highlight: true },
    { label: 'Spam',    value: spam,    highlight: false },
    { label: 'Inappr.', value: inapp,   highlight: false },
    { label: 'Total',   value: total,   highlight: true },
  ];

  const researcherChartData = [
    { label: 'Verified', value: verified, highlight: true },
    { label: 'Pending',  value: pending,  highlight: false },
    { label: 'Total',    value: totalResearchers, highlight: true },
  ];

  const activityFeed = [
    { icon: Flag,     color: '#b45309', bg: '#fef9c3', text: 'New spam report flagged automatically', time: '2 min ago' },
    { icon: UserPlus, color: '#7c3aed', bg: '#f5f3ff', text: 'Researcher verification request received', time: '15 min ago' },
    { icon: FileText, color: '#0891b2', bg: '#ecfeff', text: 'Wildlife sighting report submitted', time: '32 min ago' },
    { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', text: 'Researcher profile verified', time: '1 hr ago' },
    { icon: Trash2,   color: '#ef4444', bg: '#fef2f2', text: 'Inappropriate content removed', time: '2 hr ago' },
  ];

  const quickActions = [
    { label: 'Review Reports',    icon: Eye,       tab: 'reports',     color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Manage Users',      icon: Users,     tab: 'users',       color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Verify Researchers',icon: UserPlus,  tab: 'researchers', color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Flagged Content',   icon: Flag,      tab: 'reports',     color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.35s ease-out' }}>

      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#0f1f17', marginBottom: 4 }}>
            System Overview
          </h2>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            background: '#f0fdf4', borderRadius: 99, border: '1px solid #bbf7d0' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a',
              boxShadow: '0 0 0 3px #bbf7d0', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Live</span>
          </div>
          <button onClick={fetchStats} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'white', border: '1px solid #e5ede9',
            borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.18s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {statCards.map((card, i) => <StatCard key={card.label} card={card} index={i} />)}
      </div>

      {/* ── Middle Row: Chart + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>

        {/* Chart Card */}
        <div style={{
          background: 'white', borderRadius: 14, padding: 24,
          border: '1px solid #e5ede9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: '#0f1f17' }}>
              Content Analytics
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['reports', 'researchers'].map(tab => (
                <button key={tab} onClick={() => setActiveChart(tab)} style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  background: activeChart === tab ? '#16a34a' : '#f0f5f2',
                  color: activeChart === tab ? 'white' : '#6b7280',
                  transition: 'all 0.15s ease',
                }}>
                  {tab === 'reports' ? 'Reports' : 'Researchers'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeChart}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <MiniBarChart
                data={activeChart === 'reports' ? reportChartData : researcherChartData}
                color="#16a34a"
              />
            </motion.div>
          </AnimatePresence>

          {/* Summary row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f5f2' }}>
            {(activeChart === 'reports' ? [
              { label: 'Flagged Rate', value: total ? `${Math.round((spam + inapp) / total * 100)}%` : '0%', color: '#ef4444' },
              { label: 'Normal Rate',  value: total ? `${Math.round(normal / total * 100)}%` : '0%', color: '#16a34a' },
            ] : [
              { label: 'Verify Rate', value: totalResearchers ? `${Math.round(verified / totalResearchers * 100)}%` : '0%', color: '#16a34a' },
              { label: 'Pending',     value: `${pending} left`,  color: '#7c3aed' },
            ]).map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Verification Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick Actions */}
          <div style={{
            background: 'white', borderRadius: 14, padding: 20,
            border: '1px solid #e5ede9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#0f1f17', marginBottom: 14 }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map((action, i) => (
                <motion.button key={action.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  onClick={() => onNavigate && onNavigate(action.tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: action.bg, border: 'none', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.15s ease',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ color: action.color }}><action.icon size={15} /></div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{action.label}</span>
                  <ChevronRight size={13} color="#9ca3af" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Researcher Verification Ring */}
          <div style={{
            background: 'white', borderRadius: 14, padding: 20,
            border: '1px solid #e5ede9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#0f1f17', marginBottom: 16 }}>
              Verification Rate
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <CircleProgress value={verified} max={totalResearchers || 1} size={76} />
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#0f1f17' }}>{verified}</p>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>of {totalResearchers} verified</p>
                {pending > 0 && (
                  <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                    ⚠ {pending} pending review
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Activity + System Health ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>

        {/* Activity Feed */}
        <div style={{
          background: 'white', borderRadius: 14, padding: 24,
          border: '1px solid #e5ede9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: '#0f1f17', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="#16a34a" /> Recent Activity
            </h3>
            <span style={{ fontSize: 11, color: '#9ca3af', background: '#f0f5f2', padding: '3px 10px', borderRadius: 99 }}>
              Last 24h
            </span>
          </div>
          {activityFeed.map((item, i) => <ActivityItem key={i} item={item} index={i} />)}
        </div>

        {/* System Health */}
        <div style={{
          background: 'white', borderRadius: 14, padding: 24,
          border: '1px solid #e5ede9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: '#0f1f17', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="#16a34a" /> System Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: Server,   label: 'API Server',    status: 'ok'   },
              { icon: Database, label: 'Database',       status: 'ok'   },
              { icon: Wifi,     label: 'Network',        status: 'ok'   },
              { icon: Clock,    label: 'Auto-Flagging',  status: 'ok'   },
            ].map((item, i) => (
              <motion.div key={item.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: '#f8faf9', borderRadius: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <item.icon size={14} color="#6b7280" />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.label}</span>
                </div>
                <HealthDot label="Online" status={item.status} />
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #f0f5f2' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
              All systems operational
            </p>
            <p style={{ fontSize: 10, color: '#d1d5db', textAlign: 'center', marginTop: 2 }}>
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
