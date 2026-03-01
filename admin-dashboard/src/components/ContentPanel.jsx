import './ContentPanel.css';

export default function ContentPanel({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="content-panel">
      <div className="content-panel__header">
        <h3 className="content-panel__title">{item.label}</h3>
        <button className="content-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="content-panel__body">
        <p className="content-panel__placeholder">
          Detail view for this item will go here.
        </p>
      </div>
    </div>
  );
}
