import { useState, useCallback } from 'react';
import Sheet from './Sheet.jsx';
import './MobileNav.css';

const allNavItems = [
  { path: '/properties', label: 'Properties' },
  { path: '/messages', label: 'Inquiries', adminOnly: true },
  { path: '/bookings', label: 'Bookings', adminOnly: true },
  { path: '/templates', label: 'Templates', adminOnly: true },
  { path: '/settings', label: 'Settings', adminOnly: true },
  { path: '/schedule', label: 'Schedule', adminOnly: true },
  { path: '/leads', label: 'Leads', adminOnly: true },
];

export default function MobileNav({ activeSection, onNavigate, onHome, onLogout, isAdmin }) {
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const handleNav = useCallback((path) => {
    onNavigate(path);
    close();
  }, [onNavigate, close]);

  const handleHome = useCallback(() => {
    onHome();
    close();
  }, [onHome, close]);

  const handleLogout = useCallback(() => {
    onLogout();
    close();
  }, [onLogout, close]);

  return (
    <>
      <div className="mobile-nav__header">
        <button
          className="mobile-nav__hamburger"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <span className="mobile-nav__hamburger-line" />
          <span className="mobile-nav__hamburger-line" />
          <span className="mobile-nav__hamburger-line" />
        </button>
        <span className="mobile-nav__title">Easy Rental</span>
      </div>

      <Sheet
        open={open}
        onClose={close}
        variant="drawer-left"
        role="dialog"
        ariaLabel="Main menu"
      >
        <div className="mobile-nav__drawer-content">
          <div className="mobile-nav__drawer-header">
            <span className="mobile-nav__drawer-title">Easy Rental</span>
            <button
              className="mobile-nav__drawer-close"
              onClick={close}
              aria-label="Close menu"
            >
              &#x2715;
            </button>
          </div>

          <nav className="mobile-nav__items" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`mobile-nav__item ${activeSection === item.path ? 'mobile-nav__item--active' : ''}`}
                onClick={() => handleNav(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mobile-nav__footer">
            <button className="mobile-nav__item" onClick={handleHome}>
              Dashboard Home
            </button>
            <button className="mobile-nav__item mobile-nav__item--logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
