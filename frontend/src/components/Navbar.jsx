import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-surface">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Link to="/" className="font-display font-bold text-xl tracking-wide">
          CS2<span className="text-covert">MARKET</span>
        </Link>
        {/* Connecté, 3 actions ne tiennent pas à côté du logo sous 640px : elles passent sur une
            ligne pleine largeur, réparties, plutôt que de s'enrouler de façon bancale */}
        <div
          className={`flex items-center gap-4 ${isLoggedIn ? 'w-full justify-between sm:w-auto sm:justify-end' : ''}`}
        >
          <Link to="/about" className="text-sm text-muted hover:text-white transition-colors">
            À propos
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/alerts" className="text-sm text-muted hover:text-white transition-colors">
                Mes alertes
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
