import { useState, useCallback } from 'react';
import './MobileNav.css';

const allNavItems = [
  { path: '/properties', label: 'Properties' },
  { path: '/messages', label: 'Inquiries', adminOnly: true },
  { path: '/templates', label: 'Templates', adminOnly: true },
  { path: '/schedule', label: 'Schedule', adminOnly: true },
  { path: '/leads', label: 'Leads', adminOnly: true },
];

export default function MobileNav({ activeSection, onNavigate, onHome, onLogout, isAdmin }) {
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);
  const [open, setOpen] = useState(false);

  const handleNav = useCallback((path) => {
    onNavigate(path);
    setOpen(false);
  }, [onNavigate]);

  const handleHome = useCallback(() => {
    onHome();
    setOpen(false);
  }, [onHome]);

  const handleLogout = useCallback(() => {
    onLogout();
    setOpen(false);
  }, [onLogout]);

  return (
    <>
      <div className="mobile-nav__header">
        <button
          className="mobile-nav__hamburger"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <span className="mobile-nav__hamburger-line" />
          <span className="mobile-nav__hamburger-line" />
          <span className="mobile-nav__hamburger-line" />
        </button>
        <span className="mobile-nav__title">Easy Rental</span>
      </div>

      {open && (
        <>
          <div className="mobile-nav__backdrop" onClick={() => setOpen(false)} />
          <nav className="mobile-nav__drawer" role="navigation" aria-label="Main navigation">
            <div className="mobile-nav__drawer-header">
              <span className="mobile-nav__drawer-title">Easy Rental</span>
              <button
                className="mobile-nav__drawer-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                &#x2715;
              </button>
            </div>

            <div className="mobile-nav__items">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  className={`mobile-nav__item ${activeSection === item.path ? 'mobile-nav__item--active' : ''}`}
                  onClick={() => handleNav(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mobile-nav__footer">
              <button className="mobile-nav__item" onClick={handleHome}>
                Dashboard Home
              </button>
              <button className="mobile-nav__item mobile-nav__item--logout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
