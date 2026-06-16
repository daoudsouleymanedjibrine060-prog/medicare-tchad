import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ChatbotWidget from '../components/ChatbotWidget';

const DARK_LOGIN_PATHS = ['/connexion/assistant', '/connexion/admin', '/connexion/super-admin'];

export default function PublicLayout() {
  const { pathname } = useLocation();
  const hideNavbar = DARK_LOGIN_PATHS.includes(pathname);

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <main><Outlet /></main>
      {!hideNavbar && <ChatbotWidget />}
    </div>
  );
}