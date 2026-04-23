import { Link } from 'react-router-dom'
import './Landing.css'

const I = ({ d, size = 16, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const IconMapPin = (p) => <I {...p} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
const IconMapPinFill = (p) => (
  <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke={p.stroke || '#6B7F5E'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const IconList = (p) => <I {...p} d={["M8 6h13M8 12h13M8 18h13","M3 6h.01M3 12h.01M3 18h.01"]} />
const IconHeart = (p) => <I {...p} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.23a2 2 0 0 1 2.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0 1 22 16.92z" />
const IconMail = (p) => <I {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
const IconChevronRight = (p) => <I {...p} d="M9 18l6-6-6-6" />
const IconBed = (p) => <I {...p} strokeWidth={1.5} d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
const IconBath = (p) => <I {...p} strokeWidth={1.5} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M19 21h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z","M9 9h6M9 15h6"]} />

const featuredProperties = [
  {
    id: 'f1',
    image: '/demo/featured-1.jpg',
    title: 'Bright Living Room in North Delta',
    price: 2200,
    beds: 2,
    baths: 1,
    type: 'Basement Suite',
    location: 'Delta',
  },
  {
    id: 'f2',
    image: '/demo/featured-2.jpg',
    title: 'Modern Open-Concept Home in Fleetwood',
    price: 2850,
    beds: 3,
    baths: 2,
    type: 'House',
    location: 'Surrey',
  },
  {
    id: 'f3',
    image: '/demo/featured-3.jpg',
    title: 'Cozy Family Home Near Guildford',
    price: 2600,
    beds: 3,
    baths: 1,
    type: 'House',
    location: 'Surrey',
  },
]

const actionCards = [
  {
    to: '/map',
    icon: <div className="landing-hero__action-icon" style={{ background: 'var(--sage-light)' }}><IconMapPin size={20} stroke="#6B7F5E" /></div>,
    label: 'Search on Map',
    desc: 'Explore neighborhoods visually',
  },
  {
    to: '/listings',
    icon: <div className="landing-hero__action-icon" style={{ background: 'var(--amber-light)' }}><IconList size={20} stroke="#D4A24A" /></div>,
    label: 'Browse All Listings',
    desc: "See what's available now",
  },
  {
    to: '/my-list',
    icon: <div className="landing-hero__action-icon" style={{ background: 'var(--terracotta-light)' }}><IconHeart size={20} stroke="#C07A5B" /></div>,
    label: 'Your Favorites',
    desc: 'Save homes that speak to you',
  },
]

export default function Landing() {
  return (
    <div className="landing">
      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div className="landing-hero__grid">
            <div className="landing-hero__left">
              <span className="landing-hero__greeting">Welcome to Easy Rental</span>
              <h1 className="landing-hero__title">
                Find a place that <em>feels</em> like home
              </h1>
              <p className="landing-hero__subtitle">
                We help families and individuals find rental homes across the Lower Mainland — places where memories are made.
              </p>
              <div className="landing-hero__actions">
                {actionCards.map((card) => (
                  <Link key={card.to} to={card.to} className="landing-hero__action-card">
                    {card.icon}
                    <div className="landing-hero__action-text">
                      <div className="landing-hero__action-label">{card.label}</div>
                      <div className="landing-hero__action-desc">{card.desc}</div>
                    </div>
                    <IconChevronRight size={16} className="landing-hero__action-arrow" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="landing-hero__right">
              <div className="landing-hero__image-wrap">
                <img src="/demo/hero.jpg" alt="A warm, welcoming home" />
                <div className="landing-hero__badge">
                  <div className="landing-hero__badge-row">
                    <div className="landing-hero__badge-icon">
                      <IconMapPinFill />
                    </div>
                    <div>
                      <div className="landing-hero__badge-title">Homes across the Lower Mainland</div>
                      <div className="landing-hero__badge-text">Surrey, Vancouver, Delta & beyond</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero__contact-bar">
          <div className="landing-hero__contact-info">
            <a href="tel:604-213-9911" className="landing-hero__contact-item">
              <IconPhone size={15} />
              604-213-9911
            </a>
            <a href="mailto:aseasyrental@gmail.com" className="landing-hero__contact-item">
              <IconMail size={15} />
              aseasyrental@gmail.com
            </a>
          </div>
          <div className="landing-hero__contact-actions">
            <a href="tel:604-213-9911" className="landing-btn landing-btn--primary">
              <IconPhone size={14} />
              Call Us
            </a>
            <a href="mailto:aseasyrental@gmail.com" className="landing-btn landing-btn--outline">
              <IconMail size={14} />
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* ===== FEATURED HOMES ===== */}
      <section className="landing-featured">
        <div className="landing-featured__inner">
          <div className="landing-featured__header">
            <div>
              <p className="landing-featured__eyebrow">Featured Homes</p>
              <h2 className="landing-featured__title">
                Places waiting for <em>you</em>
              </h2>
            </div>
            <Link to="/listings" className="landing-btn landing-btn--outline">View All Listings</Link>
          </div>
          <div className="landing-featured__grid">
            {featuredProperties.map((p) => (
              <div key={p.id} className="landing-card">
                <div className="landing-card__img-wrap">
                  <img src={p.image} alt={p.title} loading="lazy" />
                </div>
                <div className="landing-card__body">
                  <h3 className="landing-card__title">{p.title}</h3>
                  <div className="landing-card__specs">
                    <span className="landing-card__spec"><IconBed size={14} />{p.beds} bed</span>
                    <span className="landing-card__spec"><IconBath size={14} />{p.baths} bath</span>
                  </div>
                  <div className="landing-card__footer">
                    <span className="landing-card__tag">{p.type}</span>
                    <span className="landing-card__loc"><IconMapPin size={13} />{p.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUOTE ===== */}
      <section className="landing-quote">
        <div className="landing-quote__inner">
          <p className="landing-quote__mark">&ldquo;</p>
          <p className="landing-quote__text">
            We didn't just find a house — we found the place where our daughter took her first steps.
          </p>
          <p className="landing-quote__attr">
            — A family who found their home through Easy Rental
          </p>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-steps">
        <div className="landing-steps__inner">
          <p className="landing-steps__eyebrow">How It Works</p>
          <h2 className="landing-steps__title">Three simple steps</h2>
          <div className="landing-steps__grid">
            <div className="landing-step">
              <div className="landing-step__circle">1</div>
              <h3 className="landing-step__title">Explore</h3>
              <p className="landing-step__desc">Browse homes on our map or filter listings to find places that match your life.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step__circle">2</div>
              <h3 className="landing-step__title">Save Your Favorites</h3>
              <p className="landing-step__desc">Heart the homes that speak to you. Build a shortlist of places worth seeing.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step__circle">3</div>
              <h3 className="landing-step__title">Get in Touch</h3>
              <p className="landing-step__desc">Call or email us. We'll walk you through every step of making it yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <p className="landing-footer__text">&copy; 2024 Easy Rental</p>
          <p className="landing-footer__text">Lower Mainland, BC &middot; 604-213-9911</p>
        </div>
      </footer>
    </div>
  )
}
