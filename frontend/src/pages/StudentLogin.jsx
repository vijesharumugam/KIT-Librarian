import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ registerNumber: '', password: '' });

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
    <div className="min-h-screen font-sans lib-bg flex flex-col justify-center py-10 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl sm:text-4xl font-serif-academic font-extrabold tracking-wide text-gold-700">Student Login</h2>
        <p className="mt-2 text-sm text-stone-700">Enter your Register Number and Password</p>
        <div className="divider-gold mt-4" />
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="book-card rounded-xl border-gold bg-white/95">
          <div className="py-6 px-4 sm:px-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="registerNumber" className="block text-sm font-medium text-stone-700">Register Number</label>
              <input
                id="registerNumber"
                name="registerNumber"
                type="text"
                required
                value={form.registerNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 sm:text-sm"
                placeholder="Enter your register number"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-emerald-50 shadow hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-stone-600">
            Don't have an account?{' '}
            <Link to="/student/register" className="text-emerald-700 hover:underline">Create one</Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
;

export default StudentLogin;
