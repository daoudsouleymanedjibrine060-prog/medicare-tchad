import { NavLink } from 'react-router-dom';

import { Heart, LogOut } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import clsx from 'clsx';

import { useAuth } from '../contexts/AuthContext';



interface NavItem {

  to: string;

  label: string;

  icon: LucideIcon;

}



export default function Sidebar({ items, title }: { items: NavItem[]; title: string }) {

  const { logout } = useAuth();



  return (

    <aside className="w-64 bg-slate-900 min-h-[calc(100vh-4rem)] hidden lg:flex lg:flex-col shrink-0">

      <div className="p-5 border-b border-slate-700">

        <div className="flex items-center gap-2 text-white font-bold">

          <Heart className="w-5 h-5 fill-primary-400 text-primary-400" />

          MediCare

        </div>

        <p className="text-xs text-slate-400 mt-1">Plateforme de santé</p>

        <p className="text-sm text-slate-300 mt-3 font-medium">{title}</p>

      </div>

      <nav className="flex-1 p-3 space-y-1">

        {items.map(({ to, label, icon: Icon }) => (

          <NavLink

            key={to}

            to={to}

            className={({ isActive }) =>

              clsx(

                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',

                isActive

                  ? 'bg-primary-600 text-white font-medium'

                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'

              )

            }

          >

            <Icon className="w-4 h-4" />

            {label}

          </NavLink>

        ))}

      </nav>

      <div className="p-3 border-t border-slate-700">

        <button

          type="button"

          onClick={() => logout()}

          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"

        >

          <LogOut className="w-4 h-4" />

          Déconnexion

        </button>

      </div>

    </aside>

  );

}

