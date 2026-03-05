import { useNavigate } from 'react-router-dom'
import './Owners.css'

const I = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.23a2 2 0 0 1 2.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0 1 22 16.92z" />
const IconMail = (p) => <I {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />
const IconBack = (p) => <I {...p} d="M19 12H5M12 19l-7-7 7-7" />

const services = [
  { title: 'Marketing & Leasing', desc: 'We find qualified tenants through targeted listings and professional showings.' },
  { title: 'Rent Collection', desc: 'Monthly rent collected and sent to you via EMT\u00a0\u2014\u00a0on time, every time.' },
  { title: 'Maintenance Coordination', desc: "We handle repair requests and vendor coordination so you don't get midnight calls." },
  { title: 'Tenant Relations', desc: 'All tenant communication managed professionally on your behalf.' },
  { title: 'Financial Reporting', desc: 'Clear monthly statements so you always know where your property stands.' },
  { title: 'Lease Management', desc: 'From signing to renewal, we handle the paperwork.' },
]

export default function Owners() {
  const navigate = useNavigate()

  return (
    <div className="owners">
      <header className="owners__header anim-fade">
        <button className="owners__back" onClick={() => navigate('/')}>
          <IconBack size={20} /> Home
        </button>
        <img src="/logo-circle.png" alt="Easy Rental" className="owners__logo" />
      </header>

      <section className="owners__hero anim-slide-up" style={{ animationDelay: '150ms' }}>
        <h1>Let us manage your property.</h1>
        <p>Easy Rental handles everything from finding tenants to collecting rent, so you can focus on what matters.</p>
      </section>

      <div className="owners__services">
        {services.map((s, i) => (
          <div key={s.title} className="owners__service anim-slide-up" style={{ animationDelay: `${250 + i * 80}ms` }}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <section className="owners__cta anim-slide-up" style={{ animationDelay: '750ms' }}>
        <h2>Interested? Let's talk.</h2>
        <div className="owners__cta-buttons">
          <a href="tel:+16042139911" className="owners__cta-btn"><IconPhone size={20} /> Call Easy Rent</a>
          <a href="mailto:aseasyrental@gmail.com" className="owners__cta-btn"><IconMail size={20} /> Email Easy Rent</a>
        </div>
      </section>
    </div>
  )
}
