import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export default function MobileNav({ items }: { items: NavItem[] }) {
  const { logout } = useAuth();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe">
      <div className="flex items-center h-16 overflow-x-auto scrollbar-hide">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[4.5rem] shrink-0',
                isActive ? 'text-primary-600' : 'text-slate-500'
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] truncate max-w-[4.5rem] text-center">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => logout()}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[4.5rem] shrink-0 text-slate-500"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Sortir</span>
        </button>
      </div>
    </nav>
  );
}
