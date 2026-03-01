import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState('Loading...')

  useEffect(() => {
    // Check API health
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setApiStatus('Connected'))
      .catch(() => setApiStatus('Disconnected'))
  }, [])

  return (
    <>
      <header className="header">
        <h1>Easy Rent</h1>
        <p>Property Rental Management System</p>
      </header>

      <main className="container">
        <section className="welcome">
          <h2>Welcome to Easy Rent</h2>
          <p>Manage your rental properties with ease.</p>
        </section>

        <section className="status">
          <h3>System Status</h3>
          <p>API Status: <strong>{apiStatus}</strong></p>
          <p>Counter: <strong>{count}</strong></p>
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
        </section>

        <section className="features">
          <h3>Features Coming Soon</h3>
          <ul>
            <li>Property Management</li>
            <li>Booking System</li>
            <li>Tenant Management</li>
            <li>Reporting & Analytics</li>
          </ul>
        </section>
      </main>

      <footer>
        <p>&copy; 2024 Easy Rent. All rights reserved.</p>
      </footer>
    </>
  )
}

export default App
