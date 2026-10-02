import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { auth } from '../services/auth';
import AuthContext from '../context/AuthContext';

function Login() {

  const navigate = useNavigate();

  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error(
      'Login must be used inside AuthProvider'
    );
  }

  const { setUser } = authContext;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);




  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const result = await api.login({
        email,
        password,
      });

      auth.setToken(result.data.accessToken);

      const me = await api.getMe();

      setUser(me.data);
      
      navigate('/dashboard');

      setMessage(result.message);

      console.log('Login response:', result);
      console.log('Authenticated user:', me.data);

      setEmail('');
      setPassword('');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient" />

      <main className="page">
        <section className="login-card">
          <div className="header">
            <p className="eyebrow">SOCIETAL PLATFORM</p>

            <h1>Welcome Back</h1>

            <p className="subtitle">
              Sign in to continue to your account.
            </p>

            
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
    Don't have an account?{' '}
    <button
        type="button"
        onClick={() => navigate('/signup')}
        className="text-purple-400 hover:text-purple-300 transition"
    >
        Sign up
    </button>
</p>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </section>
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden;
          position: relative;
          min-height: 100vh;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          color: white;
          background: #000;
        }

        .bg-gradient {
          position: fixed;
          inset: 0;
          z-index: -1;
          background: linear-gradient(
            180deg,
            #000000 0%,
            #0a0a0a 40%,
            #1a1a1a 70%,
            #2d1b4e 100%
          );
          background-size: 100% 200%;
          animation: gradient-move 15s ease infinite;
        }

        @keyframes gradient-move {
          0%,
          100% {
            background-position: 0% 0%;
          }

          50% {
            background-position: 0% 100%;
          }
        }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .login-card {
          width: 100%;
          max-width: 430px;
          padding: 34px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          background: rgba(10, 10, 10, 0.78);
          backdrop-filter: blur(14px);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.45);
        }

        .header {
          margin-bottom: 28px;
          text-align: center;
        }

        .eyebrow {
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #b78cff;
        }

        h1 {
          font-size: clamp(28px, 7vw, 38px);
          line-height: 1.15;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #a1a1aa;
          font-size: 15px;
          line-height: 1.5;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: #e4e4e7;
        }

        input {
          width: 100%;
          min-height: 50px;
          padding: 0 15px;
          border: 1px solid #3f3f46;
          border-radius: 11px;
          outline: none;
          background: rgba(24, 24, 27, 0.9);
          color: white;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input::placeholder {
          color: #71717a;
        }

        input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }

        button {
          width: 100%;
          min-height: 50px;
          margin-top: 4px;
          border: none;
          border-radius: 11px;
          background: #7c3aed;
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        button:hover:not(:disabled) {
          background: #8b5cf6;
          transform: translateY(-1px);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .success-message,
        .error-message {
          margin-top: 20px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.4;
        }

        .success-message {
          border: 1px solid rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
        }

        .error-message {
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }

        @media (max-width: 480px) {
          .page {
            padding: 16px;
          }

          .login-card {
            padding: 25px 20px;
            border-radius: 16px;
          }
        }
      `}</style>
    </>
  );
}

export default Login;