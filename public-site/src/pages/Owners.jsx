import { useNavigate } from 'react-router-dom'
import './Owners.css'

const I = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.23a2 2 0 0 1 2.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0 1 22 16.92z" />
const IconMail = (p) => <I {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />
const IconBack = (p) => <I {...p} d="M19 12H5M12 19l-7-7 7-7" />

const services = [
  'Marketing & Leasing',
  'Rent Collection',
  'Maintenance Coordination',
  'Tenant Relations',
  'Financial Reporting',
  'Lease Management',
]

export default function Owners() {
  const navigate = useNavigate()

  return (
    <div className="owners with-grain">
      <nav className="owners__nav anim-fade">
        <button className="owners__back" onClick={() => navigate('/')}>
          <IconBack size={18} /> Home
        </button>
      </nav>

      <section className="owners__hero owners__panel anim-slide-up" style={{ '--slide-distance': '24px', animationDelay: '100ms' }}>
        <div className="owners__logo-wrap">
          <img src="/logo-circle.png" alt="Easy Rental" className="owners__logo" />
        </div>
        <div className="owners__rule anim-expand" style={{ animationDelay: '450ms' }} />
        <h1>Your property, our priority.</h1>
        <p>Easy Rental handles everything from finding tenants to collecting rent, so you can focus on what matters.</p>
      </section>

      <div className="owners__services anim-slide-up" style={{ '--slide-distance': '16px', animationDelay: '400ms' }}>
        {services.map(item => (
          <span key={item} className="owners__service-item">{item}</span>
        ))}
      </div>

      <section className="owners__cta owners__panel anim-slide-up" style={{ '--slide-distance': '18px', animationDelay: '1150ms' }}>
        <h2>Ready to talk?</h2>
        <div className="owners__cta-buttons">
          <a href="mailto:aseasyrental@gmail.com" className="owners__cta-btn"><IconMail size={20} /> Email Easy Rent</a>
          <a href="tel:+16042139911" className="owners__cta-btn"><IconPhone size={20} /> Call Easy Rent</a>
        </div>
        <div className="owners__cta-contact">
          <span>604-213-9911</span>
          <span className="owners__cta-divider">|</span>
          <span>aseasyrental@gmail.com</span>
        </div>
      </section>
    </div>
  )
}
