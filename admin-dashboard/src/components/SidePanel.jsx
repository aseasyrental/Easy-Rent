import { useState } from 'react';
import PropertiesSidePanel from './PropertiesSidePanel';
import InquiriesSidePanel from './InquiriesSidePanel';
import TemplatesSidePanel from './TemplatesSidePanel';
import './SidePanel.css';

// Section configs — tabs, categories, placeholder items
const sectionConfig = {
  '/schedule': {
    label: 'Schedule',
    tabs: ['Today', 'This Week', 'Upcoming'],
    categories: {
      'Today': [
        { id: 1, label: 'Viewing — 123 Main St, 2:00 PM' },
        { id: 2, label: 'Follow-up — Jane D.' },
      ],
      'This Week': [
        { id: 3, label: 'Viewing — 456 Oak Ave, Mon 10 AM' },
        { id: 4, label: 'Lease signing — Unit 7B, Wed 3 PM' },
        { id: 5, label: 'Inspection — 789 Pine St, Fri 1 PM' },
      ],
      'Upcoming': [
        { id: 6, label: 'Open house — 321 Cedar Ln, Mar 15' },
        { id: 7, label: 'Lease renewal — Unit 4A, Mar 20' },
      ],
    },
  },
  '/properties': {
    label: 'Properties',
    tabs: ['All', 'Available', 'Rented', 'Archived'],
    categories: {
      'All': [
        { id: 1, label: '123 Main St — 2BR / Available' },
        { id: 2, label: '456 Oak Ave — 1BR / Rented' },
        { id: 3, label: '789 Pine St — 3BR / Available' },
        { id: 4, label: '321 Cedar Ln — Studio / Archived' },
      ],
      'Available': [
        { id: 1, label: '123 Main St — 2BR / $1,800' },
        { id: 3, label: '789 Pine St — 3BR / $2,400' },
      ],
      'Rented': [
        { id: 2, label: '456 Oak Ave — 1BR / Tenant: Mark R.' },
      ],
      'Archived': [
        { id: 4, label: '321 Cedar Ln — Studio / Delisted' },
      ],
    },
  },
  '/leads': {
    label: 'Leads',
    tabs: ['New', 'Viewing Requests', 'Applications', 'Qualified'],
    categories: {
      'New': [
        { id: 1, label: 'Jane D. — Inquiry about 123 Main St' },
        { id: 2, label: 'Mike T. — General inquiry' },
      ],
      'Viewing Requests': [
        { id: 3, label: 'Sarah K. — 789 Pine St, requested Mar 5' },
      ],
      'Applications': [
        { id: 4, label: 'Chris L. — 123 Main St, submitted Feb 28' },
      ],
      'Qualified': [
        { id: 5, label: 'Anna M. — Ready for lease signing' },
      ],
    },
  },
  '/messages': {
    label: 'Messages',
    tabs: ['All', 'Unread', 'Flagged'],
    categories: {
      'All': [
        { id: 1, label: 'Jane D. — "Is the unit still available?"' },
        { id: 2, label: 'Mark R. — "Maintenance request — faucet"' },
        { id: 3, label: 'Sarah K. — "Can I reschedule viewing?"' },
      ],
      'Unread': [
        { id: 1, label: 'Jane D. — "Is the unit still available?"' },
        { id: 3, label: 'Sarah K. — "Can I reschedule viewing?"' },
      ],
      'Flagged': [
        { id: 2, label: 'Mark R. — "Maintenance request — faucet"' },
      ],
    },
  },
  '/templates': {
    label: 'Templates',
    tabs: [],
    categories: {},
  },
};

export default function SidePanel({ activeSection, onSelectItem, onAddNew, onClose }) {
  const config = sectionConfig[activeSection];
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  if (!config) return null;

  // Delegate to specialized side panels
  const isProperties = activeSection === '/properties';
  const isMessages = activeSection === '/messages';
  const isComingSoon = activeSection === '/schedule' || activeSection === '/leads';
  const isTemplates = activeSection === '/templates';

  const tabName = config.tabs[activeTab];
  const items = config.categories[tabName] || [];
  const filtered = search
    ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="side-panel">
      {/* Banner */}
      <div className="side-panel__banner">
        <h2 className="side-panel__title">{config.label}</h2>
        <button className="side-panel__close" onClick={onClose} aria-label="Close panel">
          &#x2715;
        </button>
      </div>

      {isProperties ? (
        <PropertiesSidePanel onSelectItem={onSelectItem} onAddNew={onAddNew} />
      ) : isMessages ? (
        <InquiriesSidePanel onSelectItem={onSelectItem} />
      ) : isTemplates ? (
        <TemplatesSidePanel />
      ) : isComingSoon ? (
        <div className="side-panel__coming-soon">
          <p className="side-panel__coming-soon-title">Coming Soon</p>
          <p className="side-panel__coming-soon-text">
            {activeSection === '/schedule'
              ? 'Showing scheduling and calendar management are on the way.'
              : 'Lead tracking and qualification pipeline are on the way.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="side-panel__tabs">
            {config.tabs.map((tab, i) => (
              <button
                key={tab}
                className={`side-panel__tab ${i === activeTab ? 'side-panel__tab--active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="side-panel__search">
            <input
              type="text"
              placeholder={`Search ${config.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="side-panel__search-input"
            />
          </div>

          {/* Category items */}
          <div className="side-panel__items">
            {filtered.length === 0 ? (
              <p className="side-panel__empty">No results</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  className="side-panel__item"
                  onClick={() => onSelectItem(item)}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
