import { useState, useEffect } from 'react';
import apiClient from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import FeaturedWidget from './FeaturedWidget.jsx';
import './DashboardHome.css';

export default function DashboardHome({ onNavigate, onAddProperty }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const [propsRes, inquiriesRes] = await Promise.all([
          apiClient.get('/properties', { params: { limit: 1 } }),
          apiClient.get('/inquiries'),
        ]);

        if (cancelled) return;

        const totalProperties = propsRes.data.pagination?.total || 0;
        const inquiries = inquiriesRes.data.data || [];
        const newInquiries = inquiries.filter((i) => i.status === 'new').length;

        // Get status breakdown from a second call if we have properties
        let statusBreakdown = '';
        if (totalProperties > 0) {
          const allPropsRes = await apiClient.get('/properties', { params: { limit: 100 } });
          if (!cancelled) {
            const props = allPropsRes.data.data || [];
            const available = props.filter((p) => p.status === 'available').length;
            const occupied = props.filter((p) => p.status === 'occupied').length;
            const maintenance = props.filter((p) => p.status === 'maintenance').length;
            const parts = [];
            if (available) parts.push(`${available} available`);
            if (occupied) parts.push(`${occupied} occupied`);
            if (maintenance) parts.push(`${maintenance} maintenance`);
            statusBreakdown = parts.join(', ');
          }
        }

        if (!cancelled) {
          setStats({
            totalProperties,
            statusBreakdown,
            totalInquiries: inquiries.length,
            newInquiries,
          });
        }
      } catch {
        // Fail silently — dashboard is informational
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-home">
        <p className="dashboard-home__loading">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <h1 className="dashboard-home__greeting">Dashboard</h1>

      <button
        type="button"
        className="dashboard-home__card"
        onClick={() => onNavigate('/properties')}
      >
        <span className="dashboard-home__card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 4l9 5.5"/><path d="M5 8.5V19a1 1 0 001 1h12a1 1 0 001-1V8.5"/></svg>
        </span>
        <div className="dashboard-home__card-content">
          <p className="dashboard-home__card-title">Properties</p>
          <p className="dashboard-home__card-value">{stats?.totalProperties || 0}</p>
          {stats?.statusBreakdown && (
            <p className="dashboard-home__card-detail">{stats.statusBreakdown}</p>
          )}
        </div>
      </button>

      <button
        type="button"
        className="dashboard-home__card"
        onClick={() => onNavigate('/messages')}
      >
        <span className="dashboard-home__card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H8l-4 3V6z"/></svg>
        </span>
        <div className="dashboard-home__card-content">
          <p className="dashboard-home__card-title">Inquiries</p>
          <p className="dashboard-home__card-value">{stats?.totalInquiries || 0}</p>
          {stats?.newInquiries > 0 && (
            <p className="dashboard-home__card-detail">{stats.newInquiries} new</p>
          )}
        </div>
      </button>

      {isAdmin && <FeaturedWidget />}

      <div className="dashboard-home__actions">
        <button className="dashboard-home__action-btn" onClick={onAddProperty}>
          + Add Property
        </button>
        <button className="dashboard-home__action-btn" onClick={() => onNavigate('/messages')}>
          View Inquiries
        </button>
      </div>

    </div>
  );
}
