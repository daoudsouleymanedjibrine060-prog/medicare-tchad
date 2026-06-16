import { Link } from 'react-router-dom';
import RoleLoginPage from './RoleLoginPage';

export default function AssistantLoginPage() {
  return (
    <RoleLoginPage
      title="Portail Assistant"
      subtitle="Connexion Assistant"
      expectedRole="ASSISTANT"
      submitLabel="Se connecter"
      footer={
        <Link to="/connexion" className="text-slate-400 hover:text-primary-400">
          Retour connexion patient
        </Link>
      }
    />
  );
}
