import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Shield, Users, Target, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Vos rendez-vous médicaux, simplifiés au Tchad
            </h1>
            <p className="mt-6 text-lg text-primary-100">
              MediCare Tchad est une plateforme numérique de gestion des rendez-vous médicaux,
              conçue pour le Ministère de la Santé Publique et les établissements de santé publics
              et privés du pays.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/inscription" className="bg-white text-primary-700 px-6 py-3 rounded-lg font-medium hover:bg-primary-50">
                Créer un compte
              </Link>
              <Link to="/medecins" className="border border-white/40 px-6 py-3 rounded-lg font-medium hover:bg-white/10">
                Rechercher un médecin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-8 h-8 text-primary-600" />
          <h2 className="text-2xl font-bold">Problématique</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-slate-600 leading-relaxed space-y-4">
          <p>
            Malgré les efforts du système de santé tchadien, la prise de rendez-vous médicaux reste
            largement manuelle. Avec une densité d'environ 0,4 médecin pour 10 000 habitants et un
            accès limité en zone rurale, les patients doivent souvent se déplacer vers N'Djamena ou
            les chefs-lieux pour consulter.
          </p>
          <p>
            Un patient qui souhaite voir un médecin appelle plusieurs fois, se déplace physiquement
            pour fixer une date, ou attend sans savoir si un créneau est disponible. Les assistants
            médicaux gèrent les agendas à la main, ce qui entraîne des oublis, des créneaux mal
            organisés et une charge administrative importante.
          </p>
          <p>
            La connexion Internet, souvent limitée (3G/4G en ville, faible couverture à l'intérieur
            du pays), complique encore l'accès aux services numériques existants.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-bold">Objectifs</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Trouver un médecin facilement', desc: 'Recherche par spécialité, ville ou nom — sans appels répétés ni déplacements inutiles.' },
              { title: 'Aider les assistants médicaux', desc: 'Gestion simplifiée de l\'agenda, confirmation ou annulation des rendez-vous en quelques clics.' },
              { title: 'Chatbot d\'orientation', desc: 'Assistant virtuel pour guider les patients (sans diagnostic médical) vers les bons services.' },
              { title: 'Interface adaptée au Tchad', desc: 'Mobile-first, en français, indicatif +235, optimisée pour les connexions Internet lentes.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-primary-700">{title}</h3>
                <p className="text-sm text-slate-600 mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Fonctionnalités principales</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Search, title: 'Recherche de médecins', desc: 'Par spécialité, ville ou nom' },
            { icon: Calendar, title: 'Prise de RDV en ligne', desc: 'Créneaux disponibles en temps réel' },
            { icon: MapPin, title: 'Carte des établissements', desc: 'Hôpitaux, cliniques, cabinets et laboratoires' },
            { icon: Shield, title: 'Notifications SMS', desc: 'Confirmations et rappels (+235)' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-6 rounded-xl border border-slate-200">
              <Icon className="w-8 h-8 text-primary-600 mb-4" />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-slate-500 mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Users className="w-10 h-10 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Adapté au contexte tchadien</h2>
          <p className="text-slate-600 mt-3 max-w-xl mx-auto">
            Villes : N'Djamena, Moundou, Sarh, Abéché, Bongor, Doba, Mongo, Pala, Faya-Largeau, Am-Timan.
            Établissements réels : HGRN, HME, CHU Moundou, laboratoires nationaux et provinciaux.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 border-t">
        <h2 className="text-lg font-semibold text-center mb-6">Accès professionnels</h2>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/connexion/assistant" className="text-primary-600 hover:underline">Connexion Assistant</Link>
          <Link to="/connexion/admin" className="text-primary-600 hover:underline">Connexion Admin</Link>
          <Link to="/connexion/super-admin" className="text-primary-600 hover:underline">Connexion Super Admin</Link>
        </div>
      </section>
    </div>
  );
}
