import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api.js';
import useImagePosition from '../hooks/useImagePosition';
import { useAuth } from '../context/AuthContext.jsx';
import SidePanel from './SidePanel';
import ContentPanel from './ContentPanel';
import easyKeyLogo from '../assets/easy-key-logo.png';
import MobileNav from './MobileNav';
import BottomTabBar from './BottomTabBar';
import DashboardHome from './DashboardHome';
import './Shell.css';

// Natural image dimensions
const IMG_W = 4269;
const IMG_H = 2400;

// Each nav item maps to a bookshelf rectangle in image-space (0-1 fractions)
// Defined as top-left (x1,y1) and bottom-right (x2,y2)
const allNavItems = [
  {
    path: '/schedule', label: 'Schedule', adminOnly: true,
    rect: { x1: 0.5235, y1: 0.163, x2: 0.706, y2: 0.242 },
  },
  {
    path: '/properties', label: 'Properties',
    rect: { x1: 0.574, y1: 0.2525, x2: 0.822, y2: 0.3365 },
  },
  {
    path: '/leads', label: 'Leads', adminOnly: true,
    rect: { x1: 0.4585, y1: 0.342, x2: 0.6255, y2: 0.421 },
  },
  {
    path: '/messages', label: 'Inquiries', adminOnly: true,
    rect: { x1: 0.570, y1: 0.526, x2: 0.822, y2: 0.607 },
  },
  {
    path: '/templates', label: 'Templates', adminOnly: true,
    rect: { x1: 0.631, y1: 0.342, x2: 0.822, y2: 0.421 },
  },
  {
    path: '/home', label: 'Logo',
    rect: { x1: 0.367, y1: 0.525, x2: 0.437, y2: 0.599 },
  },
];

export default function Shell() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navItems = useMemo(
    () => allNavItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );
  const [activeSection, setActiveSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/inquiries').then((res) => {
      if (cancelled) return;
      const count = (res.data.data || []).filter((i) => i.status === 'new').length;
      setUnreadCount(count);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  // Flatten all corner points for the hook
  const points = useMemo(
    () => navItems.flatMap((item) => [
      { x: item.rect.x1, y: item.rect.y1 },
      { x: item.rect.x2, y: item.rect.y2 },
    ]),
    []
  );

  const mapped = useImagePosition(IMG_W, IMG_H, points);

  const handleNavClick = useCallback((path) => {
    if (path === '/home') {
      // Dashboard home — clear everything
      setActiveSection(null);
      setSelectedItem(null);
      setAddingNew(false);
      return;
    }
    if (activeSection === path) {
      // Clicking same section closes it
      setActiveSection(null);
      setSelectedItem(null);
      setAddingNew(false);
    } else {
      setActiveSection(path);
      setSelectedItem(null);
      setAddingNew(false);
    }
  }, [activeSection]);

  const handleHomeClick = useCallback(() => {
    setActiveSection(null);
    setSelectedItem(null);
    setAddingNew(false);
    navigate('/');
  }, [navigate]);

  const handleClosePanel = useCallback(() => {
    setActiveSection(null);
    setSelectedItem(null);
    setAddingNew(false);
  }, []);

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
    setAddingNew(false);
  }, []);

  const handleCloseContent = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleEditProperty = useCallback(() => {
    // Edit is now handled internally by PropertyDetail
  }, []);

  const handleDeleteProperty = useCallback(() => {
    setSelectedItem(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedItem(null);
    setAddingNew(true);
  }, []);

  const handleNewSaved = useCallback(() => {
    setAddingNew(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setAddingNew(false);
  }, []);

  const handleInquiryStatusChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleNavigateProperty = useCallback(async (inquiry) => {
    if (!inquiry.property_id) return;
    try {
      const res = await apiClient.get(`/properties/${inquiry.property_id}`);
      setActiveSection('/properties');
      setSelectedItem(res.data);
      setAddingNew(false);
    } catch {
      // Property may have been deleted
    }
  }, []);

  return (
    <div className="shell">
      {/* Background environment */}
      <div className="shell__bg" />
      <div className="shell__bg-overlay" />

      {/* Mobile navigation — header bar + hamburger drawer for admin extras */}
      <MobileNav
        activeSection={activeSection}
        onNavigate={handleNavClick}
        onHome={handleHomeClick}
        onLogout={logout}
        isAdmin={isAdmin}
      />

      {/* Bottom tab bar — mobile only, primary navigation */}
      <BottomTabBar
        activeSection={activeSection}
        onNavigate={handleNavClick}
        unreadCount={unreadCount}
      />

      {/* Home icon — top right */}
      <button
        className={`shell__home ${!activeSection ? 'shell__home--active' : ''}`}
        onClick={handleHomeClick}
        aria-label="Dashboard"
      >
        ⌂
      </button>

      {/* Admin-only compact nav — Bookings + Settings */}
      {isAdmin && (
        <div className="shell__admin-nav">
          <button
            className={`shell__admin-btn ${activeSection === '/bookings' ? 'shell__admin-btn--active' : ''}`}
            onClick={() => handleNavClick('/bookings')}
            aria-label="Bookings"
            title="Bookings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
          <button
            className={`shell__admin-btn ${activeSection === '/settings' ? 'shell__admin-btn--active' : ''}`}
            onClick={() => handleNavClick('/settings')}
            aria-label="Settings"
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
        </div>
      )}

      {/* Sign out */}
      <button className="shell__logout" onClick={logout} aria-label="Sign out">
        Sign Out
      </button>

      {/* Navigation boxes — each covers a bookshelf */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        {navItems.map((item, i) => {
          const tl = mapped[i * 2];     // top-left
          const br = mapped[i * 2 + 1]; // bottom-right

          return (
            <button
              key={item.path}
              className={`nav__box ${activeSection === item.path ? 'nav__box--active' : ''} ${item.path === '/home' ? 'nav__box--logo' : ''}`}
              onClick={() => handleNavClick(item.path)}
              aria-label={item.label}
              aria-current={activeSection === item.path ? 'page' : undefined}
              style={{
                left: `${tl.x}px`,
                top: `${tl.y}px`,
                width: `${br.x - tl.x}px`,
                height: `${br.y - tl.y}px`,
              }}
            >
              {item.path === '/home' ? (
                <img src={easyKeyLogo} alt="Easy Rental" className="nav__box-logo" />
              ) : (
                <span className="nav__box-label">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dashboard home — mobile only, shown when no section active */}
      {isMobile && !activeSection && !selectedItem && !addingNew && (
        <div className="shell__content">
          <DashboardHome
            onNavigate={handleNavClick}
            onAddProperty={() => {
              setActiveSection('/properties');
              setAddingNew(true);
            }}
          />
        </div>
      )}

      {/* Side panel — slides from left */}
      {activeSection && (
        <SidePanel
          key={`${activeSection}-${refreshKey}`}
          activeSection={activeSection}
          onSelectItem={handleSelectItem}
          onAddNew={handleAddNew}
          onClose={handleClosePanel}
        />
      )}

      {/* Content panel — slides from right */}
      {(selectedItem || addingNew || activeSection === '/settings') && (
        <ContentPanel
          item={selectedItem}
          activeSection={activeSection}
          onEdit={handleEditProperty}
          onDelete={handleDeleteProperty}
          onClose={addingNew ? handleCancelAdd : activeSection === '/settings' ? () => setActiveSection(null) : handleCloseContent}
          mode={addingNew ? 'add' : 'view'}
          onNewSave={handleNewSaved}
          onNewCancel={handleCancelAdd}
          onInquiryStatusChange={handleInquiryStatusChange}
          onNavigateProperty={handleNavigateProperty}
        />
      )}

    </div>
  );
}
