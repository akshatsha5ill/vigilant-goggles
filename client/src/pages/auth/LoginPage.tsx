import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../services/firebase/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '350px' }}>
        <h1 style={{ color: 'var(--accent-primary)', marginBottom: '10px', marginTop: '0' }}>MeetFlow</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', textAlign: 'center' }}>
          {isRegister ? 'Create a new account' : 'Sign in to access your dashboard'}
        </p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleEmailSubmit} style={{ width: '100%' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button
            type="submit"
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '15px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
          <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          style={{ width: '100%', padding: '12px 20px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'opacity 0.2s', marginBottom: '20px' }}
        >
          Sign in with Google
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}
