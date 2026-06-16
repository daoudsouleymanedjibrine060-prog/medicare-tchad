import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import ChatbotWidget from '../components/ChatbotWidget';

interface DashboardLayoutProps {
  title: string;
  navItems: { to: string; label: string; icon: LucideIcon }[];
}

export default function DashboardLayout({ title, navItems }: DashboardLayoutProps) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {!online && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 flex items-center gap-2 justify-center">
          <WifiOff className="w-4 h-4" />
          Connexion limitée — certaines fonctionnalités peuvent être indisponibles
        </div>
      )}
      <div className="flex">
        <Sidebar items={navItems} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav items={navItems} />
      <ChatbotWidget />
    </div>
  );
}
