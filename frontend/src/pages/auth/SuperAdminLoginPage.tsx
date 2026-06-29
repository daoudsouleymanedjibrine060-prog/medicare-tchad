import { Link } from 'react-router-dom';
import RoleLoginPage from './RoleLoginPage';

export default function SuperAdminLoginPage() {
  return (
    <RoleLoginPage
      title="Super Administrateur"
      subtitle="MediCare Tchad — Connexion"
      expectedRole="SUPER_ADMIN"
      submitLabel="Se connecter"
      usernameLabel="Nom d'utilisateur (email)"
      footer={
        <Link to="/connexion/admin" className="text-slate-400 hover:text-primary-400">
          Retour connexion admin
        </Link>
      }
    />
  );
}
