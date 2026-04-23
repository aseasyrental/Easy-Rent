import PropertyDetail from './PropertyDetail';
import PropertyForm from './PropertyForm';
import InquiryDetail from './InquiryDetail';
import BookingDetail from './BookingDetail';
import SettingsPage from '../pages/SettingsPage';
import './ContentPanel.css';

function isProperty(item) {
  return item && (item.title !== undefined) && (item.address !== undefined);
}

function isInquiry(item) {
  return item && (item.name !== undefined) && (item.email !== undefined) && (item.message !== undefined) && (item.address === undefined);
}

function isBooking(item) {
  return item && (item.renter_name !== undefined) && (item.scheduled_at !== undefined);
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
  const isSettings = activeSection === '/settings';

  if (!item && !isAddMode && !isSettings) return null;

  const showPropertyDetail = !isAddMode && (isProperty(item) || activeSection === '/properties');
  const showInquiryDetail = !isAddMode && !showPropertyDetail && (isInquiry(item) || activeSection === '/messages');
  const showBookingDetail = !isAddMode && !showPropertyDetail && !showInquiryDetail && (isBooking(item) || activeSection === '/bookings');

  const panelTitle = isAddMode
    ? 'New Property'
    : isSettings
      ? 'Settings'
      : showPropertyDetail
        ? item.title || 'Property Detail'
        : showInquiryDetail
          ? `Inquiry from ${item.name}`
          : showBookingDetail
            ? `Booking — ${item.renter_name || 'Detail'}`
            : item.label;

  return (
    <div className="content-panel">
      <div className="content-panel__header">
        <h3 className="content-panel__title">{panelTitle}</h3>
        <button className="content-panel__close" onClick={onClose} aria-label="Back">
          &#x2190;
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
        ) : showBookingDetail ? (
          <BookingDetail
            key={item.id}
            booking={item}
            onStatusChange={onInquiryStatusChange}
          />
        ) : isSettings ? (
          <SettingsPage />
        ) : (
          <p className="content-panel__placeholder">
            Detail view for this item will go here.
          </p>
        )}
      </div>
    </div>
  );
}
