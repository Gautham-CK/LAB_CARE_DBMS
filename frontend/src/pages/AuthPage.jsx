import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, FlaskConical, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Notice from '../components/Notice.jsx';
import Toast from '../components/Toast.jsx';
import { registerUser } from '../services/api.js';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', phone: '', role: '', department: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (isRegister) {
      if (!values.name.trim()) return setError('Enter your full name.');
      if (!validateEmail(values.email)) return setError('Enter a valid email address.');
      if (!values.role.trim()) return setError('Enter your role.');
      if (values.phone && !/^[+()\d\s-]{7,20}$/.test(values.phone)) return setError('Enter a valid phone number.');
      setLoading(true);
      setError('');
      try {
        await registerUser({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || null,
          role: values.role.trim(),
          department: values.department.trim() || null,
        });
        setToast({ tone: 'success', message: 'Account registered successfully.' });
        window.setTimeout(() => navigate('/login'), 900);
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message || 'Unable to register. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!validateEmail(values.email)) return setError('Enter a valid email address.');
    if (values.password.length < 1) return setError('Enter your password.');
    setError('Login is unavailable: the backend does not implement an authentication endpoint yet.');
  }

  return (
    <main className="auth-page">
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="auth-brand"><Link to="/" className="auth-brand-link"><span className="auth-brand-mark"><FlaskConical size={21} /></span><strong>LabCare</strong></Link></div>
      <div className="auth-layout">
        <section className="auth-card">
          <Link to="/" className="back-link"><ArrowLeft size={15} /> Back to workspace</Link>
          <div className="auth-card-heading">
            <div className="auth-heading-icon"><UserRound size={20} /></div>
            <span className="auth-eyebrow">{isRegister ? 'JOIN LABCARE' : 'WELCOME BACK'}</span>
            <h1>{isRegister ? 'Create your account' : 'Sign in to LabCare'}</h1>
            <p>{isRegister ? 'Register your profile with the laboratory workspace.' : 'Enter your credentials to continue to your workspace.'}</p>
          </div>

          {!isRegister && (
            <Notice tone="info" title="Sign-in is not connected">
              The backend has no login or password verification API. Registration is available through the existing user endpoint.
            </Notice>
          )}

          <form className="auth-form" onSubmit={submit} noValidate>
            {isRegister && (
              <>
                <label className="field-label" htmlFor="name">Full name <span>*</span></label>
                <div className="input-wrap"><UserRound size={17} /><input id="name" name="name" autoComplete="name" placeholder="e.g. Alex Morgan" value={values.name} onChange={update} required /></div>
              </>
            )}
            <label className="field-label" htmlFor="email">Email address <span>*</span></label>
            <div className="input-wrap"><Mail size={17} /><input id="email" name="email" type="email" autoComplete="email" placeholder="you@institution.edu" value={values.email} onChange={update} required /></div>

            {isRegister && (
              <>
                <label className="field-label" htmlFor="role">Role <span>*</span></label>
                <div className="input-wrap"><UserRound size={17} /><input id="role" name="role" placeholder="e.g. Technician, Lab manager" value={values.role} onChange={update} required /></div>
                <div className="form-grid">
                  <div><label className="field-label" htmlFor="phone">Phone number</label><input className="plain-input" id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" value={values.phone} onChange={update} /></div>
                  <div><label className="field-label" htmlFor="department">Department</label><input className="plain-input" id="department" name="department" placeholder="e.g. Chemistry" value={values.department} onChange={update} /></div>
                </div>
                <p className="auth-field-note">These fields match the existing backend. Password-based registration is not supported by its API.</p>
              </>
            )}

            {!isRegister && (
              <>
                <label className="field-label" htmlFor="password">Password <span>*</span></label>
                <div className="input-wrap"><LockKeyhole size={17} /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={values.password} onChange={update} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              </>
            )}

            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><LoaderCircle size={17} className="spinner" /> {isRegister ? 'Creating account…' : 'Signing in…'}</> : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-switch">
            {isRegister ? <>Already registered? <Link to="/login">Sign in</Link></> : <>New to LabCare? <Link to="/register">Create an account</Link></>}
          </div>
          <p className="auth-secure-note"><LockKeyhole size={13} />{isRegister ? 'Registration is sent only to the configured backend.' : 'Sign-in details are not sent because authentication is not implemented.'}</p>
        </section>
        <aside className="auth-aside">
          <div className="auth-aside-mark"><FlaskConical size={23} /></div>
          <span className="auth-eyebrow">BUILT FOR BETTER LABS</span>
          <h2>Everything your lab needs to run smoothly.</h2>
          <p>Keep equipment, maintenance, and support organized in one clear workspace.</p>
          <div className="auth-aside-rule" />
          <div className="auth-aside-caption"><span className="aside-indicator" />A more reliable way to manage lab operations</div>
        </aside>
      </div>
      <div className="auth-footer"><span>© {new Date().getFullYear()} LabCare</span><span>Laboratory operations workspace</span></div>
    </main>
  );
}
