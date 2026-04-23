import { useState, useEffect } from 'react';
import apiClient from '../services/api.js';
import './SettingsPage.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    working_hours_start: '09:00',
    working_hours_end: '19:00',
    bill_contact_phone: '',
  });

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/admin/settings')
      .then((res) => {
        if (cancelled) return;
        setSettings(res.data);
        setForm({
          working_hours_start: res.data.working_hours_start || '09:00',
          working_hours_end: res.data.working_hours_end || '19:00',
          bill_contact_phone: res.data.bill_contact_phone || '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to load settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.put('/admin/settings', form);
      setSettings(res.data);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await apiClient.get('/admin/settings/google/auth');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start Google connection.');
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await apiClient.post('/admin/settings/google/disconnect');
      setSettings((prev) => prev ? { ...prev, google_connected: false, google_email: null } : prev);
    } catch (err) {
      setError('Failed to disconnect Google Calendar.');
    }
  };

  if (loading) {
    return <div className="settings-page__loading">Loading settings…</div>;
  }

  return (
    <div className="settings-page">
      <h2 className="settings-page__title">Settings</h2>

      {error && <div className="settings-page__error">{error}</div>}
      {saved && <div className="settings-page__saved">Settings saved.</div>}

      <div className="settings-page__section">
        <h3 className="settings-page__section-title">Google Calendar</h3>
        {settings?.google_connected ? (
          <div className="settings-page__connected">
            <p className="settings-page__connected-text">
              Connected as <strong>{settings.google_email}</strong>
            </p>
            <button
              className="settings-page__btn settings-page__btn--disconnect"
              onClick={handleDisconnectGoogle}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="settings-page__disconnected">
            <p className="settings-page__hint">Bookings are disabled until you connect a calendar.</p>
            <button
              className="settings-page__btn settings-page__btn--primary"
              onClick={handleConnectGoogle}
            >
              Connect Google Calendar
            </button>
          </div>
        )}
        <p className="settings-page__warning">
          Cancel bookings from the Bookings panel, not from Google Calendar — otherwise the renter won't be notified.
        </p>
      </div>

      <div className="settings-page__section">
        <h3 className="settings-page__section-title">Working Hours</h3>
        <div className="settings-page__field-row">
          <label className="settings-page__label">
            Start
            <input
              type="time"
              className="settings-page__input"
              value={form.working_hours_start}
              onChange={(e) => handleChange('working_hours_start', e.target.value)}
            />
          </label>
          <label className="settings-page__label">
            End
            <input
              type="time"
              className="settings-page__input"
              value={form.working_hours_end}
              onChange={(e) => handleChange('working_hours_end', e.target.value)}
            />
          </label>
        </div>
        <p className="settings-page__hint">
          Last 30-min slot on a {form.working_hours_start}–{form.working_hours_end} day starts at {(() => {
            const [h, m] = form.working_hours_end.split(':').map(Number);
            const startMin = h * 60 + m - 30;
            const sh = Math.floor(startMin / 60);
            const sm = startMin % 60;
            return `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
          })()}.
        </p>
      </div>

      <div className="settings-page__section">
        <h3 className="settings-page__section-title">Contact Phone</h3>
        <input
          type="tel"
          className="settings-page__input settings-page__input--full"
          placeholder="Bill's phone number (shown in confirmation emails)"
          value={form.bill_contact_phone}
          onChange={(e) => handleChange('bill_contact_phone', e.target.value)}
        />
        <p className="settings-page__hint">If set, included in renter confirmation emails so they can reach you day-of.</p>
      </div>

      <button
        className="settings-page__btn settings-page__btn--primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
