import { Link, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/home'
import NotFound from './pages/not-found'
import Whitepaper from './pages/whitepaper'

function App() {
  const location = useLocation()

  return (
    <div className='app'>
      <Routes location={location}>
        <Route path="/" element={
          <main>
            <Header />
            <Home />
          </main>
        } />

        <Route
          path="/whitepaper"
          element={
            <main className="">
              <Header />
              <Whitepaper />
            </main>
          }
        />
        {/* Catch all 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

function Header() {
  return (
    <header>
      <nav className="navbar">
        <div className='logo-body'>
          <h1 className="navbar-brand">BaseMusic</h1>
          <span className='sub-logo'>by YARDSTICKS</span>
        </div>
        <ul className="navbar-nav">
          <li><Link to="/whitepaper" className="nav-link">Whitepaper</Link></li>
          <li><Link to="#" className="nav-link">Contact Us</Link></li>
        </ul>
      </nav>
    </header>
  )
}

export default App
