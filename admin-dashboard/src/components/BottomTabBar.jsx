import './BottomTabBar.css';

const tabs = [
  {
    path: '/home', label: 'Dashboard',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    path: '/properties', label: 'Properties',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 4l9 5.5"/><path d="M5 8.5V19a1 1 0 001 1h12a1 1 0 001-1V8.5"/></svg>,
  },
  {
    path: '/messages', label: 'Inquiries',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H8l-4 3V6z"/></svg>,
  },
];

export default function BottomTabBar({ activeSection, onNavigate, unreadCount }) {
  return (
    <nav className="bottom-tab-bar" role="navigation" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`bottom-tab-bar__tab ${activeSection === tab.path ? 'bottom-tab-bar__tab--active' : ''}`}
          onClick={() => onNavigate(tab.path)}
          aria-label={tab.label}
          aria-current={activeSection === tab.path ? 'page' : undefined}
        >
          <span className="bottom-tab-bar__icon">{tab.icon}</span>
          <span className="bottom-tab-bar__label">{tab.label}</span>
          {tab.path === '/messages' && unreadCount > 0 && (
            <span className="bottom-tab-bar__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
