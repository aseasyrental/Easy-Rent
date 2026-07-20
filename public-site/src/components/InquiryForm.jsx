import { useState } from 'react'
import apiClient from '../services/api.js'
import './InquiryForm.css'

export default function InquiryForm({ propertyId, leased = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [wantsViewing, setWantsViewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState([])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setErrors([])
    try {
      const payload = { property_id: propertyId, ...form }
      // Left off unless asked for, so the controller keeps defaulting to 'question'.
      // A leased home can't be viewed, so that panel never offers the option.
      if (wantsViewing && !leased) payload.type = 'viewing_request'
      await apiClient.post('/inquiries', payload)
      setSent(true)
    } catch (err) {
      const data = err.response?.data
      // The API puts the useful per-field notes in errors[]; its top-level message
      // is just "Validation failed", which tells a renter nothing about what to fix.
      const messages = Array.isArray(data?.errors) && data.errors.length
        ? data.errors
        : [data?.message || 'Failed to send. Please try again.']
      setErrors(messages)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="inquiry-form">
        <p className="inquiry-form__success">
          Message sent! We'll get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form className="inquiry-form" onSubmit={handleSubmit}>
      <h3 className="inquiry-form__title">
        {leased ? 'Ask About Similar Homes' : 'Send a Message'}
      </h3>
      <input
        className="inquiry-form__input"
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={e => handleChange('name', e.target.value)}
        required
      />
      <input
        className="inquiry-form__input"
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={e => handleChange('email', e.target.value)}
        required
      />
      <input
        className="inquiry-form__input"
        type="tel"
        placeholder="Your phone number (optional)"
        value={form.phone}
        onChange={e => handleChange('phone', e.target.value)}
      />
      {!leased && (
        <label className="inquiry-form__check">
          <input
            className="inquiry-form__checkbox"
            type="checkbox"
            checked={wantsViewing}
            onChange={e => setWantsViewing(e.target.checked)}
          />
          <span className="inquiry-form__check-label">I'd like to schedule a viewing</span>
        </label>
      )}
      <textarea
        className="inquiry-form__textarea"
        placeholder={leased
          ? "I'm looking for something like this — same area, similar price..."
          : "I'm interested in this property..."}
        value={form.message}
        onChange={e => handleChange('message', e.target.value)}
        required
      />
      {errors.length > 0 && (
        <div className="inquiry-form__error">
          {errors.map((msg, i) => <p key={i}>{msg}</p>)}
        </div>
      )}
      <button className="inquiry-form__submit" type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
