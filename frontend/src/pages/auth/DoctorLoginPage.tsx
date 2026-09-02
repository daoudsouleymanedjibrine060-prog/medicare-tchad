import { Link } from 'react-router-dom';
import RoleLoginPage from './RoleLoginPage';

export default function DoctorLoginPage() {
  return (
    <RoleLoginPage
      title="Portail Médecin"
      subtitle="Connexion Médecin"
      expectedRole="DOCTOR"
      submitLabel="Se connecter"
      footer={
        <Link to="/connexion" className="text-slate-400 hover:text-primary-400">
          Retour connexion patient
        </Link>
      }
    />
  );
}
