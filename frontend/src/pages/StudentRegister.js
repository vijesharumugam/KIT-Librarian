import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ registerNumber: '', phoneNumber: '', password: '', name: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!form.name.trim() || !form.department.trim()) {
        setError('Name and Department are required');
        return;
      }
      const res = await fetch('http://localhost:5000/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          registerNumber: form.registerNumber.trim(),
          phoneNumber: form.phoneNumber.trim(),
          password: form.password,
          name: form.name.trim(),
          department: form.department.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed');
        return;
      }
      setSuccess('Registered successfully. Redirecting...');
      // Cookie is set by backend; navigate to dashboard
      setTimeout(() => navigate('/student/dashboard'), 500);
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 py-8 md:py-12">
        <div className="w-full max-w-md md:max-w-lg space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Create your account</h2>
            <p className="mt-2 text-sm text-slate-400">Register to access your dashboard and start borrowing.</p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/10 shadow-xl bg-slate-900/50">
            {error && (
              <div className="mb-4 rounded-md border border-red-400/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">{error}</div>
            )}
            {success && (
              <div className="mb-4 rounded-md border border-emerald-400/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">{success}</div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm text-slate-300">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm text-slate-300">Department</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  value={form.department}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Artificial Intelligence and Data Science"
                />
              </div>

              <div>
                <label htmlFor="registerNumber" className="block text-sm text-slate-300">Register Number</label>
                <input
                  id="registerNumber"
                  name="registerNumber"
                  type="text"
                  required
                  value={form.registerNumber}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., REG0001"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm text-slate-300">Phone Number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., +911234567890"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-slate-300">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 pr-10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Minimum 8 characters"
                    minLength={8}
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
              </div>

              <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center btn-primary-blue disabled:opacity-60">
                {loading ? 'Registering...' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">Already have an account?</p>
            <Link to="/student/login" className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-slate-100 hover:bg-slate-800/70">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentRegister;
