import { useEffect, useState } from 'react';
import { ApiError, getProfile, getUsers, loginUser, registerUser } from './api.js';

const TOKEN_KEY = 'usuarios.jwt';

function readSavedSession() {
  try {
    return { token: window.localStorage.getItem(TOKEN_KEY), error: '' };
  } catch (error) {
    console.error('No se pudo leer la sesión guardada:', error);
    return {
      token: null,
      error: 'El almacenamiento del navegador no está disponible; la sesión no se conservará.',
    };
  }
}

function AuthForm({ mode, onModeChange, onLogin, onRegister }) {
  const [values, setValues] = useState({
    nombre: '',
    correo: '',
    password: '',
    edad: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const registering = mode === 'register';

  function changeMode(nextMode) {
    setError('');
    setNotice('');
    setValues({ nombre: '', correo: '', password: '', edad: '' });
    onModeChange(nextMode);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (registering) {
        const user = {
          nombre: values.nombre.trim(),
          correo: values.correo.trim(),
          password: values.password,
        };
        if (values.edad !== '') {
          user.edad = Number(values.edad);
        }
        await onRegister(user);
        setNotice('Cuenta creada. Ahora inicia sesión con tu correo y contraseña.');
        changeMode('login');
        setNotice('Cuenta creada. Ahora inicia sesión con tu correo y contraseña.');
      } else {
        await onLogin({
          correo: values.correo.trim(),
          password: values.password,
        });
      }
    } catch (requestError) {
      setError(requestError.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="card-mark" aria-hidden="true">
        <span>U</span>
      </div>
      <p className="eyebrow">{registering ? 'EMPIEZA AQUÍ' : 'QUÉ BUENO VERTE'}</p>
      <h2 id="auth-title">{registering ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
      <p className="card-intro">
        {registering
          ? 'Regístrate para acceder al espacio de usuarios.'
          : 'Ingresa tus datos para continuar de forma segura.'}
      </p>

      <div className="mode-switch" role="group" aria-label="Tipo de acceso">
        <button
          className={!registering ? 'mode-button active' : 'mode-button'}
          onClick={() => changeMode('login')}
          type="button"
        >
          Iniciar sesión
        </button>
        <button
          className={registering ? 'mode-button active' : 'mode-button'}
          onClick={() => changeMode('register')}
          type="button"
        >
          Crear cuenta
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {registering && (
          <label>
            Nombre completo
            <input
              autoComplete="name"
              maxLength={100}
              name="nombre"
              onChange={updateField}
              placeholder="Tu nombre"
              required
              value={values.nombre}
            />
          </label>
        )}
        <label>
          Correo electrónico
          <input
            autoComplete="email"
            maxLength={254}
            name="correo"
            onChange={updateField}
            placeholder="nombre@correo.com"
            required
            type="email"
            value={values.correo}
          />
        </label>
        <label>
          Contraseña
          <input
            autoComplete={registering ? 'new-password' : 'current-password'}
            minLength={6}
            name="password"
            onChange={updateField}
            placeholder={registering ? 'Al menos 6 caracteres' : 'Tu contraseña'}
            required
            type="password"
            value={values.password}
          />
        </label>
        {registering && (
          <label>
            Edad <span className="optional">(opcional)</span>
            <input
              min="0"
              name="edad"
              onChange={updateField}
              placeholder="Tu edad"
              step="1"
              type="number"
              value={values.edad}
            />
          </label>
        )}

        {error && (
          <p className="form-message error" aria-live="polite">
            {error}
          </p>
        )}
        {notice && (
          <p className="form-message success" aria-live="polite">
            {notice}
          </p>
        )}
        <button className="submit-button" disabled={loading} type="submit">
          {loading
            ? 'Un momento…'
            : registering
              ? 'Crear cuenta'
              : 'Entrar a mi cuenta'}
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <p className="form-footnote">
        Al continuar, tus datos se validan de forma segura.
      </p>
    </section>
  );
}

function Dashboard({ profile, users, onLogout, loading, error }) {
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <a aria-label="Usuarios, inicio" className="brand" href="/">
          <span className="brand-mark">U</span>
          <span>usuarios<span className="brand-dot">.</span></span>
        </a>
        <button className="logout-button" onClick={onLogout} type="button">
          Cerrar sesión <span aria-hidden="true">↗</span>
        </button>
      </header>

      <section className="welcome-panel">
        <div>
          <p className="eyebrow">ESPACIO PERSONAL</p>
          <h1>Hola, {profile?.nombre || 'bienvenido'}.</h1>
          <p className="welcome-copy">
            Tu sesión está activa. Aquí puedes consultar la información de la comunidad.
          </p>
        </div>
        <div className="profile-chip">
          <span className="avatar">{(profile?.nombre || 'U').charAt(0).toUpperCase()}</span>
          <span>
            <strong>{profile?.nombre}</strong>
            <small>{profile?.correo}</small>
          </span>
        </div>
      </section>

      <section aria-labelledby="directory-title" className="directory">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DIRECTORIO</p>
            <h2 id="directory-title">Usuarios registrados</h2>
          </div>
          <span className="count-pill">{users.length} en total</span>
        </div>

        {error && <p className="form-message error" role="alert">{error}</p>}
        {loading ? (
          <div className="empty-state">Cargando usuarios…</div>
        ) : users.length === 0 ? (
          <div className="empty-state">Todavía no hay usuarios registrados.</div>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <article className="user-row" key={user.id}>
                <span className="user-avatar">
                  {(user.nombre || '?').charAt(0).toUpperCase()}
                </span>
                <div className="user-details">
                  <strong>{user.nombre}</strong>
                  <span>{user.correo}</span>
                </div>
                <div className="user-meta">
                  {user.edad !== undefined && user.edad !== null && (
                    <span>{user.edad} años</span>
                  )}
                  <span className="role-pill">{user.rol || 'usuario'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="dashboard-footer">Sesión protegida con autenticación JWT</footer>
    </main>
  );
}

export default function App() {
  const [savedSession] = useState(readSavedSession);
  const [token, setToken] = useState(savedSession.token);
  const [mode, setMode] = useState('login');
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [authMessage, setAuthMessage] = useState(savedSession.error);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setUsers([]);
      return undefined;
    }

    const controller = new AbortController();
    setDashboardLoading(true);
    setDashboardError('');

    Promise.all([getProfile(token, controller.signal), getUsers(token, controller.signal)])
      .then(([profileResponse, usersResponse]) => {
        setProfile(profileResponse.datos);
        setUsers(usersResponse.datos);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (error instanceof ApiError && error.status === 401) {
          signOut();
          setAuthMessage('Tu sesión venció. Inicia sesión nuevamente.');
          return;
        }
        setDashboardError(error.message || 'No se pudo cargar la información.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setDashboardLoading(false);
      });

    return () => controller.abort();
  }, [token]);

  function saveToken(value) {
    try {
      window.localStorage.setItem(TOKEN_KEY, value);
      setAuthMessage('');
    } catch (error) {
      console.error('No se pudo guardar la sesión:', error);
      setAuthMessage('No se pudo guardar la sesión en este navegador.');
    }
    setToken(value);
  }

  function signOut() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('No se pudo limpiar la sesión guardada:', error);
      setAuthMessage('No se pudo limpiar la sesión guardada en este navegador.');
    }
    setToken(null);
    setProfile(null);
    setUsers([]);
  }

  async function handleLogin(credentials) {
    const result = await loginUser(credentials);
    saveToken(result.token);
  }

  async function handleRegister(user) {
    await registerUser(user);
  }

  if (token) {
    return (
      <Dashboard
        error={dashboardError}
        loading={dashboardLoading}
        onLogout={signOut}
        profile={profile}
        users={users}
      />
    );
  }

  return (
    <main className="auth-page">
      <header className="topbar">
        <a aria-label="Usuarios, inicio" className="brand" href="/">
          <span className="brand-mark">U</span>
          <span>usuarios<span className="brand-dot">.</span></span>
        </a>
        <span className="topbar-note">Un espacio para estar al día</span>
      </header>
      <div className="auth-layout">
        <section className="intro-panel">
          <div className="intro-orbit orbit-one" />
          <div className="intro-orbit orbit-two" />
          <div className="intro-content">
            <p className="eyebrow">GESTIÓN DE USUARIOS</p>
            <h1>Todo empieza con una buena conexión.</h1>
            <p className="intro-copy">
              Accede a tu espacio personal y mantente conectado con tu comunidad.
            </p>
            <div className="security-note">
              <span className="security-icon" aria-hidden="true">✓</span>
              <span>
                <strong>Tu cuenta, protegida</strong>
                <small>Autenticación segura para cada sesión.</small>
              </span>
            </div>
          </div>
          <span className="intro-index">01 / ACCESO SEGURO</span>
        </section>
        <div className="form-column">
          <AuthForm
            mode={mode}
            onLogin={handleLogin}
            onModeChange={setMode}
            onRegister={handleRegister}
          />
          {authMessage && <p className="form-message error" role="alert">{authMessage}</p>}
          <p className="copyright">© {new Date().getFullYear()} Usuarios</p>
        </div>
      </div>
    </main>
  );
}
