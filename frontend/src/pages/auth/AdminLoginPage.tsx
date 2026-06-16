import { Link } from 'react-router-dom';
import RoleLoginPage from './RoleLoginPage';

export default function AdminLoginPage() {
  return (
    <RoleLoginPage
      title="Portail Administrateur"
      subtitle="Accès sécurisé"
      expectedRole="ADMIN"
      submitLabel="Accès sécurisé"
      usernameLabel="Nom d'utilisateur (email)"
      footer={
        <div className="space-y-2">
          <Link to="/connexion/super-admin" className="block text-primary-400 hover:underline">
            Connexion Super Administrateur
          </Link>
          <Link to="/connexion" className="block text-slate-400 hover:text-primary-400">
            Retour connexion patient
          </Link>
        </div>
      }
    />
  );
}
