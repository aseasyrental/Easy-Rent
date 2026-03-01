import { useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useImagePosition from '../hooks/useImagePosition';
import SidePanel from './SidePanel';
import ContentPanel from './ContentPanel';
import bgEnvironment from '../assets/bg-environment.png';
import './Shell.css';

// Natural image dimensions
const IMG_W = 4269;
const IMG_H = 2400;

// Each nav item maps to a bookshelf rectangle in image-space (0-1 fractions)
// Defined as top-left (x1,y1) and bottom-right (x2,y2)
const navItems = [
  {
    path: '/schedule', icon: '▣', label: 'Schedule',
    rect: { x1: 0.5235, y1: 0.163, x2: 0.706, y2: 0.242 },
  },
  {
    path: '/properties', icon: '▦', label: 'Properties',
    rect: { x1: 0.574, y1: 0.2525, x2: 0.822, y2: 0.3365 },
  },
  {
    path: '/leads', icon: '◎', label: 'Leads',
    rect: { x1: 0.4585, y1: 0.342, x2: 0.6255, y2: 0.421 },
  },
  {
    path: '/messages', icon: '◈', label: 'Messages',
    rect: { x1: 0.570, y1: 0.526, x2: 0.822, y2: 0.607 },
  },
  {
    path: '/home', icon: '◉', label: 'Logo',
    rect: { x1: 0.367, y1: 0.525, x2: 0.437, y2: 0.599 },
  },
];

export default function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

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
      // Logo — could go to public site or be decorative
      return;
    }
    if (activeSection === path) {
      // Clicking same section closes it
      setActiveSection(null);
      setSelectedItem(null);
    } else {
      setActiveSection(path);
      setSelectedItem(null);
    }
  }, [activeSection]);

  const handleHomeClick = useCallback(() => {
    setActiveSection(null);
    setSelectedItem(null);
    navigate('/');
  }, [navigate]);

  const handleClosePanel = useCallback(() => {
    setActiveSection(null);
    setSelectedItem(null);
  }, []);

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const handleCloseContent = useCallback(() => {
    setSelectedItem(null);
  }, []);

  return (
    <div className="shell">
      {/* Background environment */}
      <div
        className="shell__bg"
        style={{ backgroundImage: `url(${bgEnvironment})` }}
      />
      <div className="shell__bg-overlay" />

      {/* Home icon — top right */}
      <button
        className={`shell__home ${!activeSection ? 'shell__home--active' : ''}`}
        onClick={handleHomeClick}
        aria-label="Dashboard"
      >
        ⌂
      </button>

      {/* Navigation boxes — each covers a bookshelf */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        {navItems.map((item, i) => {
          const tl = mapped[i * 2];     // top-left
          const br = mapped[i * 2 + 1]; // bottom-right

          return (
            <button
              key={item.path}
              className={`nav__box ${activeSection === item.path ? 'nav__box--active' : ''}`}
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
              <span className="nav__box-icon">{item.icon}</span>
              <span className="nav__box-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Side panel — slides from left */}
      {activeSection && (
        <SidePanel
          activeSection={activeSection}
          onSelectItem={handleSelectItem}
          onClose={handleClosePanel}
        />
      )}

      {/* Content panel — slides from right */}
      {selectedItem && (
        <ContentPanel
          item={selectedItem}
          onClose={handleCloseContent}
        />
      )}

    </div>
  );
}
