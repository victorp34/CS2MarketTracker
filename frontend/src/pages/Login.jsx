import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Message posé par api.js quand une session a expiré (401 avec token présent).
  // Lu une seule fois puis effacé, pour ne pas réapparaître à une prochaine visite.
  useEffect(() => {
    const message = sessionStorage.getItem('authMessage');
    if (message) {
      setInfoMessage(message);
      sessionStorage.removeItem('authMessage');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfoMessage(null);

    try {
      const action = mode === 'login' ? api.login : api.register;
      const { token } = await action(email, password);
      login(token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="font-display font-bold text-2xl mb-6 text-center">
        {mode === 'login' ? 'Connexion' : 'Créer un compte'}
      </h1>

      {infoMessage && (
        <p className="text-sm text-gold bg-gold/10 border border-gold/30 rounded px-3 py-2 mb-4 text-center">
          {infoMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mot de passe (8 caractères min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>

        {error && <p className="text-sm text-covert">{error}</p>}
      </form>

      <button
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="text-sm text-muted hover:text-white mt-4 w-full text-center transition-colors"
      >
        {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  );
}
