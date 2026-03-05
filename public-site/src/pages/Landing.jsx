import { useNavigate } from 'react-router-dom'
import rentalOverlay from '../assets/rental-overlay.png'
import './Landing.css'

const I = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconMap = (p) => <I {...p} d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" />
const IconGrid = (p) => <I {...p} d="M4 6h16M4 10h16M4 14h12M4 18h8" />
const IconBuilding = (p) => <I {...p} d="M3 21V3h8v4h10v14H3zM5 5v2h2V5H5zm0 4v2h2V9H5zm0 4v2h2v-2H5zm0 4v2h2v-2H5zm4-12v2h2V5H9zm4 4v2h2V9h-2zm0 4v2h2v-2h-2zm0 4v2h2v-2h-2z" />
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.23a2 2 0 0 1 2.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0 1 22 16.92z" />
const IconMail = (p) => <I {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing__overlay anim-fade" style={{ animationDelay: '400ms' }}>
        <img src={rentalOverlay} alt="" className="landing__overlay-img" />
      </div>

      <div className="landing__top anim-fade">
        <img src="/logo-full.png" alt="Easy Rental" className="landing__logo" />
        <div className="landing__nav-tiles">
          <button className="landing__tile landing__tile--primary" onClick={() => navigate('/map')}>
            <IconMap size={40} />
            <span>Search Map</span>
          </button>
          <button className="landing__tile landing__tile--outline" onClick={() => navigate('/listings')}>
            <IconGrid size={40} />
            <span>Browse Listings</span>
          </button>
          <button className="landing__tile landing__tile--outline" onClick={() => navigate('/owners')}>
            <IconBuilding size={40} />
            <span>Property Owners</span>
          </button>
        </div>
      </div>

      <div className="landing__tagline-row">
        <div className="landing__tagline-panel anim-slide-up" style={{ '--slide-distance': '16px', animationDelay: '250ms' }}>
          <p className="landing__tagline" onClick={() => navigate('/listings')} style={{ cursor: 'pointer' }}>
            Rental homes in the Lower Mainland
          </p>
          <div className="landing__rule anim-expand" style={{ animationDelay: '500ms' }} />
        </div>
      </div>

      <footer className="landing__footer anim-slide-up" style={{ '--slide-distance': '12px', animationDelay: '700ms' }}>
        <div className="landing__footer-contact">
          <a href="tel:+16042139911" className="landing__footer-contact-line">604-213-9911</a>
          <span className="landing__footer-contact-divider">|</span>
          <a href="mailto:aseasyrental@gmail.com" className="landing__footer-contact-line">aseasyrental@gmail.com</a>
        </div>
        <div className="landing__footer-ctas">
          <a href="tel:+16042139911" className="landing__footer-btn"><IconPhone size={20} /> Call Easy Rent</a>
          <a href="mailto:aseasyrental@gmail.com" className="landing__footer-btn"><IconMail size={20} /> Email Easy Rent</a>
        </div>
      </footer>
    </div>
  )
}
