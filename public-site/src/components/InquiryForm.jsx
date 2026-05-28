import { useState } from 'react'
import apiClient from '../services/api.js'
import './InquiryForm.css'

export default function InquiryForm({ propertyId, leased = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await apiClient.post('/inquiries', {
        property_id: propertyId,
        ...form,
      })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send. Please try again.')
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
      <span className="inquiry-form__title">
        {leased ? 'Ask About Similar Homes' : 'Send a Message'}
      </span>
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
      <textarea
        className="inquiry-form__textarea"
        placeholder={leased
          ? "I'm looking for something like this — same area, similar price..."
          : "I'm interested in this property..."}
        value={form.message}
        onChange={e => handleChange('message', e.target.value)}
        required
      />
      {error && <p className="inquiry-form__error">{error}</p>}
      <button className="inquiry-form__submit" type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
