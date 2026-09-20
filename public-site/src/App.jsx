import { Component } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MapView from './pages/MapView.jsx'
import Listings from './pages/Listings.jsx'
import Furnished from './pages/Furnished.jsx'
import MyList from './pages/MyList.jsx'
import Picks from './pages/Picks.jsx'
import Owners from './pages/Owners.jsx'
import SingleHome from './pages/SingleHome.jsx'

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.5rem', fontSize: '1rem', cursor: 'pointer',
              border: '1px solid #ccc', borderRadius: '4px', background: '#fff',
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const location = useLocation()

  // A home opened from a card carries the page it was opened from, so that page keeps
  // rendering behind the panel (tap a home on Furnished Stays and Furnished Stays stays
  // put). A home opened by its own link carries nothing, so Browse renders behind it.
  const backgroundPath = typeof location.state?.backgroundLocation === 'string'
    ? location.state.backgroundLocation
    : null
  const pagePathname = backgroundPath ? backgroundPath.split('?')[0] : location.pathname
  const hideNav = pagePathname === '/' || pagePathname === '/owners'

  return (
    <ErrorBoundary>
      {!hideNav && <NavBar />}
      <Routes location={backgroundPath || location}>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/furnished" element={<Furnished />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/picks" element={<Picks />} />
        <Route path="/owners" element={<Owners />} />
        {/* Visiting a home's own link with nothing behind it: Browse fills the page. */}
        <Route path="/home/:id" element={<Listings />} />
        <Route path="*" element={
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page not found</h1>
            <a href="/listings" style={{ color: '#2563eb' }}>Browse listings</a>
          </div>
        } />
      </Routes>

      {/* The panel always reads the real address, whatever page sits behind it. */}
      <Routes>
        <Route path="/home/:id" element={<SingleHome />} />
        <Route path="*" element={null} />
      </Routes>
    </ErrorBoundary>
  )
}
