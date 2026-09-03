import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, getRoleHomePath } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, 'PATIENT');
      navigate(redirect && redirect.startsWith('/patient') ? redirect : getRoleHomePath(user.role));
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center">Connexion</h1>
        <p className="text-sm text-slate-500 text-center mt-2">
          Connectez-vous avec l&apos;email et le mot de passe de votre compte
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
              {error}
              {error.includes('Inscrivez-vous') && (
                <p className="mt-2">
                  <Link to="/inscription" className="font-medium text-primary-700 underline">
                    Créer mon compte
                  </Link>
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <Link
          to="/inscription"
          className="mt-3 flex w-full items-center justify-center rounded-lg border border-primary-600 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
        >
          Créer mon compte
        </Link>

        <p className="text-sm text-center mt-4 text-slate-500">
          Chaque personne utilise son propre email et mot de passe.
        </p>

        <details className="mt-6 text-xs text-slate-400">
          <summary className="cursor-pointer select-none hover:text-slate-500">
            Comptes de test uniquement
          </summary>
          <div className="mt-2 space-y-0.5 pl-1">
            <p>Patient : patient@medicare-td.test / Patient@123</p>
            <p>Admin : admin@medicare-td.test / Admin@123 (portail admin)</p>
          </div>
        </details>
      </div>
    </div>
  );
}
