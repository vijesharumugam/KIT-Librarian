import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ registerNumber: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          registerNumber: form.registerNumber.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Invalid credentials');

      // Redirect to student dashboard
      navigate('/student/dashboard');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP flow removed; password-based login with HttpOnly cookie is used instead.

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Global Header */}
      <header className="w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <img src={logoUrl} alt="Logo" className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/90 object-contain" onError={(e)=>{e.currentTarget.style.display='none';}} />
          <div className="min-w-0">
            <p className="text-slate-100 text-base sm:text-xl md:text-2xl font-bold tracking-wide whitespace-normal md:whitespace-nowrap break-words leading-snug">Kalaignarkarunanidhi Institute of Technology</p>
            <p className="text-slate-300 text-xs sm:text-sm leading-tight">Read • Research • Rise</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: Brand + Quote (hidden on small) */}
        <section className="hidden lg:flex w-full lg:w-1/2 relative overflow-hidden items-center justify-center dark-grid">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-indigo-500/5 to-transparent" />
          <div className="pointer-events-none absolute inset-0">
            <svg className="absolute left-10 top-16 h-10 w-10 text-indigo-300/20 float-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M4 5.5a2 2 0 012-2h10.5v13H6a2 2 0 00-2 2V5.5z"/>
              <path d="M6 3.5v13"/>
              <path d="M8 6.5h7"/>
              <path d="M8 9.5h7"/>
            </svg>
            <svg className="absolute right-20 top-28 h-12 w-12 text-violet-300/20 float-medium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M3.5 6l8.5-2.5L20.5 6v12l-8.5 2.5L3.5 18V6z"/>
              <path d="M12 3.5v17"/>
              <path d="M7 8h3"/>
              <path d="M14 10h3"/>
            </svg>
            <svg className="absolute left-24 bottom-24 h-12 w-12 text-pink-300/20 float-fast" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M4 7.5l8-3 8 3v9l-8 3-8-3v-9z"/>
              <path d="M12 4.5v12"/>
              <path d="M7 10h10"/>
            </svg>
            <svg className="absolute right-10 bottom-16 h-9 w-9 text-blue-300/20 float-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M5 5.5h9a3 3 0 013 3v9H8a3 3 0 01-3-3v-9z"/>
              <path d="M8 8.5h6"/>
              <path d="M8 11.5h6"/>
            </svg>
          </div>
          <div className="relative w-full max-w-4xl px-10 py-16 text-center">
            <div className="absolute left-1/2 -translate-x-1/2 top-8 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
            <h1 className="mt-2 text-3xl xl:text-4xl font-extrabold tracking-tight text-indigo-400">KIT Library</h1>
            <p className="mt-2 text-slate-300 text-base md:text-lg">Your Journey to Knowledge Excellence</p>
          </div>
        </section>

        {/* Right: Login Card */}
        <section className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 py-8 md:py-12">
          <div className="w-full max-w-md md:max-w-lg space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">Student Login</h2>
              <p className="mt-2 text-sm text-slate-400">Enter your Register Number and Password to continue.</p>
            </div>

            <div className="glass-card p-6 rounded-xl border border-white/10 shadow-xl bg-slate-900/50">
              {error && (
                <div className="mb-4 rounded-md border border-red-400/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">{error}</div>
              )}
              <form onSubmit={handleSubmit}>
                <label htmlFor="registerNumber" className="block text-sm text-slate-300">Register Number</label>
                <input
                  id="registerNumber"
                  name="registerNumber"
                  type="text"
                  value={form.registerNumber}
                  onChange={handleChange}
                  placeholder="Enter your register number"
                  className="mt-1 w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />

                <label htmlFor="password" className="block text-sm mt-4 text-slate-300">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 pr-10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.09A10.44 10.44 0 0112 5c5 0 9 5 9 7a12.33 12.33 0 01-2.3 3.23M6.11 6.11A12.52 12.52 0 003 12c0 2 4 7 9 7a10.74 10.74 0 004.1-.78" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <button type="submit" disabled={loading} className="mt-5 inline-flex w-full items-center justify-center btn-primary-blue disabled:opacity-60">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                New to KIT Library? Join our community and start your journey today!
              </p>

              <Link to="/student/register" className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-slate-100 hover:bg-slate-800/70">
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentLogin;
