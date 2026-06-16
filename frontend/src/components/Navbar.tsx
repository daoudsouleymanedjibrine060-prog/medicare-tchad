import { Link } from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth, getRoleHomePath } from '../contexts/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary-700 text-lg">
            <Heart className="w-6 h-6 fill-primary-600 text-primary-600" />
            MediCare Tchad
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/medecins" className="text-sm text-slate-600 hover:text-primary-600">Médecins</Link>
            {user ? (
              <>
                <Link to={getRoleHomePath(user.role)} className="text-sm text-slate-600 hover:text-primary-600">
                  Mon espace
                </Link>
              </>
            ) : (
              <>
                <Link to="/connexion" className="text-sm text-slate-600 hover:text-primary-600">Connexion</Link>
                <Link to="/inscription" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                  Inscription
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/medecins" className="block py-2 text-sm" onClick={() => setOpen(false)}>Médecins</Link>
            {user ? (
              <Link to={getRoleHomePath(user.role)} className="block py-2 text-sm" onClick={() => setOpen(false)}>Mon espace</Link>
            ) : (
              <>
                <Link to="/connexion" className="block py-2 text-sm" onClick={() => setOpen(false)}>Connexion</Link>
                <Link to="/inscription" className="block py-2 text-sm text-primary-600" onClick={() => setOpen(false)}>Inscription</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
