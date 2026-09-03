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
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-xl tracking-wide">
          CS2<span className="text-covert">MARKET</span>
        </Link>
        <div className="flex items-center gap-4">
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
