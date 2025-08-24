import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ registerNumber: '', phoneNumber: '', password: '', name: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    <div className="min-h-screen font-sans lib-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl sm:text-4xl font-serif-academic font-extrabold text-gold-700">Student Registration</h2>
        <p className="mt-2 text-sm text-stone-700">Create your account to access the dashboard</p>
        <div className="divider-gold mt-4" />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="book-card border-gold bg-white/95 py-8 px-4 sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">{success}</div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-stone-700">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                required
                value={form.department}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., Artificial Intelligence and Data Science"
              />
            </div>
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
                placeholder="e.g., REG0001"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-stone-700">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={form.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., +911234567890"
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
                placeholder="Minimum 8 characters"
                minLength={8}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-emerald-50 shadow hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
