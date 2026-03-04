import PropertyDetail from './PropertyDetail';
import PropertyForm from './PropertyForm';
import InquiryDetail from './InquiryDetail';
import './ContentPanel.css';

function isProperty(item) {
  return item && (item.title !== undefined) && (item.address !== undefined);
}

function isInquiry(item) {
  return item && (item.name !== undefined) && (item.email !== undefined) && (item.message !== undefined) && (item.address === undefined);
}

export default function ContentPanel({
  item,
  activeSection,
  onEdit,
  onDelete,
  onClose,
  mode,
  onNewSave,
  onNewCancel,
  onInquiryStatusChange,
  onNavigateProperty,
}) {
  const isAddMode = mode === 'add';

  if (!item && !isAddMode) return null;

  const showPropertyDetail = !isAddMode && (isProperty(item) || activeSection === '/properties');
  const showInquiryDetail = !isAddMode && !showPropertyDetail && (isInquiry(item) || activeSection === '/messages');

  const panelTitle = isAddMode
    ? 'New Property'
    : showPropertyDetail
      ? item.title || 'Property Detail'
      : showInquiryDetail
        ? `Inquiry from ${item.name}`
        : item.label;

  return (
    <div className="content-panel">
      <div className="content-panel__header">
        <h3 className="content-panel__title">{panelTitle}</h3>
        <button className="content-panel__close" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
      </div>

      <div className="content-panel__body">
        {isAddMode ? (
          <PropertyForm onSave={onNewSave} onCancel={onNewCancel} />
        ) : showPropertyDetail ? (
          <PropertyDetail
            property={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={onClose}
          />
        ) : showInquiryDetail ? (
          <InquiryDetail
            key={item.id}
            inquiry={item}
            onStatusChange={onInquiryStatusChange}
            onNavigateProperty={onNavigateProperty}
          />
        ) : (
          <p className="content-panel__placeholder">
            Detail view for this item will go here.
          </p>
        )}
      </div>
    </div>
  );
}
