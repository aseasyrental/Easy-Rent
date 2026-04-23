import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api.js';
import './BookingSheet.css';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function loadRecaptchaScript() {
  if (document.getElementById('recaptcha-v3')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'recaptcha-v3';
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function getRecaptchaToken(action) {
  if (!RECAPTCHA_SITE_KEY) return null;
  await loadRecaptchaScript();
  return new Promise((resolve) => {
    if (!window.grecaptcha?.ready) return resolve(null);
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(() => resolve(null));
    });
  });
}

function toPTDate(iso) {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function toPTTime(iso) {
  return new Date(iso).toLocaleTimeString('en-CA', {
    timeZone: 'America/Vancouver',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDayLabel(date) {
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: 'America/Vancouver',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDayPT(iso) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export default function BookingSheet({ property, open, onClose }) {
  const [step, setStep] = useState('day');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [noSlots, setNoSlots] = useState(false);
  const panelRef = useRef(null);

  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true);
    setError(null);
    setNoSlots(false);
    try {
      const now = new Date();
      const from = now.toISOString();
      const to = addDays(now, 30).toISOString();
      const res = await apiClient.get('/bookings/availability', {
        params: { property_id: property.id, from, to },
      });
      const data = res.data?.slots || [];
      setSlots(data);
      if (data.length === 0) setNoSlots(true);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setError('Unable to load availability right now. Please try again in a moment.');
    } finally {
      setLoadingSlots(false);
    }
  }, [property.id]);

  useEffect(() => {
    if (open) {
      setStep('day');
      setSelectedDay(null);
      setSelectedTime(null);
      setForm({ name: '', email: '', phone: '', note: '' });
      setError(null);
      setSubmitting(false);
      fetchSlots();
    }
  }, [open, fetchSlots]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus trap + initial focus
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const id = requestAnimationFrame(() => {
      const first = panel.querySelector('button:not([disabled]), input, textarea');
      if (first) first.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, step]);

  const daysWithSlots = new Set(slots.map((s) => startOfDayPT(s)));

  const days = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = addDays(now, i);
    const ptStr = d.toLocaleDateString('en-CA', {
      timeZone: 'America/Vancouver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    days.push({ date: ptStr, hasSlots: daysWithSlots.has(ptStr) });
  }

  const daySlots = selectedDay
    ? slots.filter((s) => startOfDayPT(s) === selectedDay)
    : [];

  const handleDaySelect = (dayStr) => {
    setSelectedDay(dayStr);
    setSelectedTime(null);
    setStep('time');
  };

  const handleTimeSelect = (timeIso) => {
    setSelectedTime(timeIso);
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const captchaToken = await getRecaptchaToken('booking_submit');
      const res = await apiClient.post('/bookings', {
        property_id: property.id,
        scheduled_at: selectedTime,
        renter_name: form.name.trim(),
        renter_email: form.email.trim(),
        renter_phone: form.phone.trim() || undefined,
        renter_note: form.note.trim() || undefined,
        captcha_token: captchaToken,
      });

      if (res.data?.status === 'pending_verification') {
        setStep('pending');
      } else if (res.data?.status === 'confirmed') {
        setStep('pending'); // Already confirmed — still show confirmation message
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      // If slot conflict, refetch slots
      if (err.response?.status === 409) {
        fetchSlots();
        setStep('time');
        setSelectedTime(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="booking-sheet__backdrop" onClick={onClose} />
      <div className="booking-sheet" ref={panelRef} role="dialog" aria-modal="true" aria-label="Book a viewing">
        <div className="booking-sheet__header">
          <h2 className="booking-sheet__title">Book a Viewing</h2>
          <button className="booking-sheet__close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {error && <div className="booking-sheet__error">{error}</div>}

        {step === 'day' && (
          <div className="booking-sheet__step">
            {loadingSlots ? (
              <p className="booking-sheet__loading">Loading available dates…</p>
            ) : noSlots ? (
              <div className="booking-sheet__empty">
                <p>No openings in the next 30 days.</p>
                <p className="booking-sheet__hint">Submit an inquiry instead and we’ll get back to you.</p>
              </div>
            ) : (
              <>
                <p className="booking-sheet__subtitle">Pick a day <span className="booking-sheet__tz">(Pacific Time)</span></p>
                <div className="booking-sheet__calendar" role="grid">
                  {days.map((d) => {
                    const isSelected = selectedDay === d.date;
                    return (
                      <button
                        key={d.date}
                        className={`booking-sheet__day ${d.hasSlots ? 'booking-sheet__day--available' : 'booking-sheet__day--disabled'} ${isSelected ? 'booking-sheet__day--selected' : ''}`}
                        onClick={() => d.hasSlots && handleDaySelect(d.date)}
                        disabled={!d.hasSlots}
                        role="gridcell"
                        aria-disabled={!d.hasSlots}
                        aria-selected={isSelected}
                      >
                        <span className="booking-sheet__day-label">{formatDayLabel(d.date)}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {step === 'time' && (
          <div className="booking-sheet__step">
            <p className="booking-sheet__subtitle">{formatDayLabel(selectedDay)} <span className="booking-sheet__tz">(Pacific Time)</span></p>
            <div className="booking-sheet__times">
              {daySlots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    className={`booking-sheet__time ${isSelected ? 'booking-sheet__time--selected' : ''}`}
                    onClick={() => handleTimeSelect(slot)}
                    aria-pressed={isSelected}
                  >
                    {toPTTime(slot)}
                  </button>
                );
              })}
            </div>
            <button className="booking-sheet__back" onClick={() => setStep('day')}>&larr; Back to days</button>
          </div>
        )}

        {step === 'form' && (
          <form className="booking-sheet__form" onSubmit={handleSubmit}>
            <p className="booking-sheet__subtitle">{toPTTime(selectedTime)} on {formatDayLabel(selectedDay)}</p>
            <input
              className="booking-sheet__input"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="booking-sheet__input"
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <input
              className="booking-sheet__input"
              type="tel"
              placeholder="Phone number (optional)"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <textarea
              className="booking-sheet__textarea"
              placeholder="Note for Bill (optional)"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              rows={3}
            />
            <button
              className="booking-sheet__submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Confirming…' : 'Confirm booking'}
            </button>
            <button type="button" className="booking-sheet__back" onClick={() => setStep('time')}>&larr; Back to times</button>
          </form>
        )}

        {step === 'pending' && (
          <div className="booking-sheet__step">
            <div className="booking-sheet__success">
              <p className="booking-sheet__success-title">Almost there.</p>
              <p>Check your email for a verification link — your viewing isn’t booked until you click it.</p>
              <p className="booking-sheet__hint">The link expires in 30 minutes.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
