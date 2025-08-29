import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingDecor from '../components/FloatingDecor';
import api from '../utils/api';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', department: '', phoneNumber: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initial, setInitial] = useState({ name: '', department: '', phoneNumber: '', email: '' });

  const loadProfile = async () => {
    try {
      setError('');
      const { data, status } = await api.get('/api/student/profile', { validateStatus: () => true });
      if (status === 401) {
        navigate('/student/login');
        return;
      }
      if (status >= 400) throw new Error(data?.message || 'Failed to load profile');
      const next = {
        name: data.name || '',
        department: data.department || '',
        phoneNumber: data.phoneNumber || '',
        email: data.email ?? '',
      };
      setForm(next);
      setInitial(next);
      setIsEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    try {
      setSaving(true);
      setError('');
      const { data, status } = await api.put('/api/student/profile', form, { validateStatus: () => true });
      if (status >= 400) throw new Error(data?.message || 'Failed to update profile');
      setSuccess('Profile updated successfully');
      const updated = {
        name: data.name || form.name,
        department: data.department || form.department,
        phoneNumber: data.phoneNumber || form.phoneNumber,
        email: data.email ?? '',
      };
      setForm(updated);
      setInitial(updated);
      setIsEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col relative">
      <FloatingDecor />
      {/* Global Header */}
      <header className="w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/90 object-contain" onError={(e)=>{e.currentTarget.style.display='none';}} />
            <div className="min-w-0">
              <p className="text-slate-100 text-base sm:text-xl font-bold tracking-wide whitespace-normal md:whitespace-nowrap break-words leading-snug">Student Profile</p>
              <p className="text-slate-300 text-xs sm:text-sm leading-tight">View and update your information</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 hover:bg-slate-800/70 touch-target"
          >
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-3 sm:px-6 py-6 sm:py-8 flex-1">
        {error && (
          <div className="mb-4 rounded-md border border-red-400/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-emerald-400/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">{success}</div>
        )}

        <div className="glass-card rounded-2xl bg-slate-900/50 border border-white/10 shadow-xl overflow-hidden">
          {/* Edit button (view mode) */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute right-6 mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 shadow hover:bg-slate-800/70 touch-target"
              aria-label="Edit profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
              </svg>
              Edit
            </button>
          )}
          <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                disabled={!isEditing}
                className={`w-full rounded-lg border px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isEditing ? 'border-white/10 bg-slate-800' : 'border-white/10 bg-slate-900/40 cursor-default'}`}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={onChange}
                required
                disabled={!isEditing}
                className={`w-full rounded-lg border px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isEditing ? 'border-white/10 bg-slate-800' : 'border-white/10 bg-slate-900/40 cursor-default'}`}
                placeholder="Department"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email (for notifications)</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                disabled={!isEditing}
                className={`w-full rounded-lg border px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isEditing ? 'border-white/10 bg-slate-800' : 'border-white/10 bg-slate-900/40 cursor-default'}`}
                placeholder="student@example.com"
              />
              {!isEditing && !form.email && (
                <p className="mt-1 text-xs text-slate-400">No email set. Add one to receive due date reminders.</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Phone Number</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChange}
                required
                disabled={!isEditing}
                pattern="^[0-9+\-()\s]{7,15}$"
                title="Enter a valid phone number"
                className={`w-full rounded-lg border px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isEditing ? 'border-white/10 bg-slate-800' : 'border-white/10 bg-slate-900/40 cursor-default'}`}
                placeholder="Phone Number"
              />
            </div>

            {isEditing && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500 disabled:opacity-60 btn-primary-blue touch-target"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setForm(initial); setIsEditing(false); setError(''); setSuccess(''); }}
                  className="rounded-md border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 hover:bg-slate-800/70 touch-target"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
      <footer className="mt-auto">
        <div className="w-full h-12" />
      </footer>
    </div>
  );
};

export default StudentProfile;
