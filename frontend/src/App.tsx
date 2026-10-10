import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import HypeLabPage from './pages/HypeLabPage'
import HypeLabEventPage from './pages/HypeLabEventPage'
import UpcomingEventsPage from './pages/UpcomingEventsPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import MyEventsPage from './pages/MyEventsPage'
import AdminPage from './admin/AdminPage'
import { UserAuthProvider } from './auth/UserAuthContext'

//import NotFound from './pages/NotFound'

function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/adminn')

  useEffect(() => {
    document.documentElement.style.overscrollBehaviorY = 'none'
    document.body.style.overscrollBehaviorY = 'none'
    //document.body.style.backgroundColor = '#0A0A0A'
  }, [])

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [pathname])

  return (
    <UserAuthProvider>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hype-lab" element={<HypeLabPage />} />
        <Route path="/hype-lab/:slug" element={<HypeLabEventPage />} />
        <Route path="/upcoming-events" element={<UpcomingEventsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/adminn" element={<AdminPage />} />
      </Routes>
    </UserAuthProvider>
  )
}

export default App