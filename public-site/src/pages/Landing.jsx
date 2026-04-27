import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useMyList from '../hooks/useMyList.js'
import apiClient from '../services/api.js'
import './Landing.css'

const I = ({ d, size = 16, stroke = 'currentColor', strokeWidth = 2, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const IconMapPin = (p) => <I {...p} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
const IconList = (p) => <I {...p} d={["M8 6h13M8 12h13M8 18h13","M3 6h.01M3 12h.01M3 18h.01"]} />
const IconHeart = (p) => <I {...p} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.23a2 2 0 0 1 2.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0 1 22 16.92z" />
const IconMail = (p) => <I {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
const IconChevronRight = (p) => <I {...p} d="M9 18l6-6-6-6" />
const IconBed = (p) => <I {...p} strokeWidth={1.5} d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
const IconBath = (p) => <I {...p} strokeWidth={1.5} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M19 21h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z","M9 9h6M9 15h6"]} />
const IconSqft = (p) => <I {...p} strokeWidth={1.5} d="M3 3h18v18H3z" />

const actionCards = [
  {
    to: '/map',
    icon: <div className="landing-hero__action-icon" style={{ background: 'rgba(107,127,94,0.18)' }}><IconMapPin size={20} stroke="#A8C090" /></div>,
    label: 'See homes on a map',
    desc: 'Explore neighborhoods visually',
  },
  {
    to: '/listings',
    icon: <div className="landing-hero__action-icon" style={{ background: 'rgba(212,162,74,0.18)' }}><IconList size={20} stroke="#E8C878" /></div>,
    label: 'Browse all homes',
    desc: "See what's available now",
  },
  {
    to: '/my-list',
    icon: <div className="landing-hero__action-icon" style={{ background: 'rgba(192,122,91,0.18)' }}><IconHeart size={20} stroke="#D4A090" /></div>,
    label: 'Save homes you like',
    desc: 'Keep a list to share or review',
  },
]

function useScrollReveal(threshold = 0.2, deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.querySelectorAll('[data-reveal]')
    if (targets.length === 0) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold, rootMargin: '0px 0px -40px 0px' })

    targets.forEach((target) => observer.observe(target))

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, ...deps])

  return ref
}

export default function Landing() {
  const [properties, setProperties] = useState([])
  const [propsLoading, setPropsLoading] = useState(true)
  const heroRef = useRef(null)
  const topThreeRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)
  const [scrollHidden, setScrollHidden] = useState(false)
  const { toggle, has } = useMyList()

  const topThreeRevealRef = useScrollReveal(0.2, [propsLoading])
  const quoteRef = useScrollReveal()
  const stepsRef = useScrollReveal()
  const ownersRef = useScrollReveal()
  const footerRef = useScrollReveal(0.1)

  // Fetch first 3 real properties
  useEffect(() => {
    let cancelled = false
    const fetchProps = async () => {
      try {
        const res = await apiClient.get('/properties', { params: { limit: 3, sort: 'newest' } })
        if (!cancelled) setProperties((res.data?.data || []).slice(0, 3))
      } catch {
        if (!cancelled) setProperties([])
      } finally {
        if (!cancelled) setPropsLoading(false)
      }
    }
    fetchProps()
    return () => { cancelled = true }
  }, [])

  // Scroll tracking: hero fade, parallax, scroll affordance
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY
          setScrollY(y)
          setScrollHidden(y > 100)

          // Parallax on top-three cards
          const grid = topThreeRef.current
          if (grid) {
            const rect = grid.getBoundingClientRect()
            const progress = -rect.top / (rect.height + window.innerHeight)
            const cards = grid.querySelectorAll('[data-parallax]')
            const speeds = [-35, 18, -22]
            cards.forEach((card, i) => {
              const offset = speeds[i] * Math.max(-1, Math.min(1, progress))
              card.style.setProperty('--parallax-y', `${offset}px`)
            })
          }

          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const heroOpacity = Math.max(0, 1 - scrollY / ((heroRef.current?.offsetHeight || window.innerHeight) * 0.65))

  return (
    <div className="landing">
      {/* ===== HERO ===== */}
      <section
        className="landing-hero"
        ref={heroRef}
        style={{ opacity: heroOpacity, pointerEvents: heroOpacity < 0.05 ? 'none' : 'auto' }}
      >
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__overlay" aria-hidden="true" />

        <div className="landing-hero__inner">
          <span className="landing-hero__eyebrow anim-hero anim-hero--slide-up anim-hero-delay-1">
            Rental homes in the Lower Mainland
          </span>
          <h1 className="landing-hero__title anim-hero anim-hero--slide-up anim-hero-delay-2">
            Find a place that <em>feels</em> like home
          </h1>
          <p className="landing-hero__subtitle anim-hero anim-hero--fade anim-hero-delay-3">
            We help families and individuals find rental homes across the Lower Mainland.
          </p>

          <div className="landing-hero__actions">
            {actionCards.map((card, i) => (
              <Link
                key={card.to}
                to={card.to}
                className={`landing-hero__action-card anim-hero anim-hero--slide-up anim-hero-delay-${i + 4}`}
              >
                {card.icon}
                <div className="landing-hero__action-text">
                  <div className="landing-hero__action-label">{card.label}</div>
                  <div className="landing-hero__action-desc">{card.desc}</div>
                </div>
                <IconChevronRight size={16} className="landing-hero__action-arrow" />
              </Link>
            ))}
          </div>

          <div className="landing-hero__ctas anim-hero anim-hero--fade anim-hero-delay-7">
            <Link to="/listings" className="landing-btn landing-btn--primary">
              See homes for rent
            </Link>
            <a href="tel:604-213-9911" className="landing-btn landing-btn--outline-dark">
              Call us: 604-213-9911
            </a>
          </div>
        </div>

        <div className={`landing-hero__scroll ${scrollHidden ? 'is-hidden' : ''}`}>Scroll</div>
      </section>

      {/* ===== THREE REAL HOMES ===== */}
      <section className="landing-topthree with-grain" ref={topThreeRevealRef}>
        <div className="landing-topthree__inner">
          <p data-reveal className="landing-topthree__eyebrow reveal-delay-1">Available now</p>
          <h2 data-reveal className="landing-topthree__title reveal-delay-2">Three of our homes for rent</h2>
          <p data-reveal className="landing-topthree__subtitle reveal-delay-3">
            Tap any home to see photos, details, and how to apply.
          </p>

          {propsLoading ? (
            <div data-reveal className="landing-topthree__loading reveal-delay-4">Loading homes…</div>
          ) : properties.length === 0 ? (
            <div data-reveal className="landing-topthree__empty reveal-delay-4">
              No homes available right now. <Link to="/listings">Browse all homes</Link>
            </div>
          ) : (
            <div className="landing-topthree__grid" ref={topThreeRef}>
              {properties.map((p, i) => {
                const primaryImage = (p.images || []).find(img => img.is_primary) || (p.images || [])[0]
                const isSaved = has(p.id)
                return (
                  <div
                    key={p.id}
                    data-parallax={i}
                    className="landing-topthree__card"
                    style={{ '--parallax-y': '0px' }}
                  >
                    <div data-reveal className={`landing-topthree__card-inner reveal-delay-${i + 4}`}>
                      <div className="landing-topthree__card-imgwrap">
                        {primaryImage ? (
                          <img src={primaryImage.url} alt={p.title} loading="lazy" />
                        ) : (
                          <div className="landing-topthree__card-placeholder">No photo</div>
                        )}
                      </div>
                      <div className="landing-topthree__card-body">
                        <div className="landing-topthree__card-price">
                          {p.price != null ? (
                            <>
                              ${Number(p.price).toLocaleString()}
                              <span>/mo</span>
                            </>
                          ) : (
                            'Rent TBD'
                          )}
                        </div>
                        <h3 className="landing-topthree__card-title">{p.title}</h3>
                        <div className="landing-topthree__card-specs">
                          {p.bedrooms != null && (
                            <span><IconBed size={14} />{p.bedrooms} bed</span>
                          )}
                          {p.bathrooms != null && (
                            <span><IconBath size={14} />{p.bathrooms} bath</span>
                          )}
                          {p.sqft != null && (
                            <span><IconSqft size={14} />{p.sqft} sqft</span>
                          )}
                        </div>
                        <div className="landing-topthree__card-actions">
                          <Link to="/listings" className="landing-btn landing-btn--primary">
                            See this home →
                          </Link>
                          <button
                            className={`landing-topthree__card-save ${isSaved ? 'is-saved' : ''}`}
                            onClick={() => toggle(p.id)}
                            aria-label={isSaved ? 'Remove from My List' : 'Save this home'}
                          >
                            <IconHeart size={16} />
                            {isSaved ? 'Saved' : 'Save this home'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== BRAND STATEMENT ===== */}
      <section ref={quoteRef} className="landing-quote with-grain">
        <div className="landing-quote__inner">
          <p data-reveal className="landing-quote__mark reveal-delay-1">&ldquo;</p>
          <p data-reveal className="landing-quote__text reveal-delay-2">
            We answer the phone. We meet you at the showing. We help you fill out the paperwork. That is it.
          </p>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section ref={stepsRef} className="landing-steps with-grain">
        <div className="landing-steps__inner">
          <p data-reveal className="landing-steps__eyebrow reveal-delay-1">How it works</p>
          <h2 data-reveal className="landing-steps__title reveal-delay-2">Three simple steps</h2>
          <div className="landing-steps__grid">
            <div data-reveal className="landing-step reveal-delay-3">
              <div className="landing-step__circle">1</div>
              <h3 className="landing-step__title">Browse</h3>
              <p className="landing-step__desc">Look at homes on our map or in the list. Save the ones you like.</p>
              <Link to="/listings" className="landing-btn landing-btn--outline">Browse homes for rent</Link>
            </div>
            <div data-reveal className="landing-step reveal-delay-4">
              <div className="landing-step__circle">2</div>
              <h3 className="landing-step__title">Visit</h3>
              <p className="landing-step__desc">Tell us which home you want to see. We will set up a time.</p>
              <a href="mailto:aseasyrental@gmail.com" className="landing-btn landing-btn--outline">Email us about a viewing</a>
            </div>
            <div data-reveal className="landing-step reveal-delay-5">
              <div className="landing-step__circle">3</div>
              <h3 className="landing-step__title">Apply</h3>
              <p className="landing-step__desc">We help you through the rental application. Move in when ready.</p>
              <a href="tel:604-213-9911" className="landing-btn landing-btn--outline">Call us: 604-213-9911</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OWNERS ===== */}
      <section ref={ownersRef} className="landing-owners with-grain">
        <div className="landing-owners__inner">
          <p data-reveal className="landing-owners__eyebrow reveal-delay-1">For property owners</p>
          <h2 data-reveal className="landing-owners__title reveal-delay-2">
            Looking to rent out your home?
          </h2>
          <p data-reveal className="landing-owners__body reveal-delay-3">
            We handle the marketing, the viewings, the paperwork, and the people.
            You stay in the loop. We do the work.
          </p>
          <div data-reveal className="landing-owners__cta-row reveal-delay-4">
            <Link to="/owners" className="landing-owners__cta">
              List your property &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer ref={footerRef} className="landing-footer with-grain">
        <div data-reveal className="landing-footer__inner reveal-delay-1">
          <p className="landing-footer__text">&copy; 2026 Easy Rental</p>
          <p className="landing-footer__text">Lower Mainland, BC &middot; 604-213-9911</p>
        </div>
      </footer>
    </div>
  )
}
