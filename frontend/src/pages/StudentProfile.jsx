import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', department: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initial, setInitial] = useState({ name: '', department: '', phoneNumber: '' });

  const loadProfile = async () => {
    try {
      setError('');
      const res = await fetch('http://localhost:5000/api/student/profile', {
        credentials: 'include',
      });
      if (res.status === 401) {
        navigate('/student/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load profile');
      const next = {
        name: data.name || '',
        department: data.department || '',
        phoneNumber: data.phoneNumber || '',
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
      const res = await fetch('http://localhost:5000/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      setSuccess('Profile updated successfully');
      const updated = {
        name: data.name || form.name,
        department: data.department || form.department,
        phoneNumber: data.phoneNumber || form.phoneNumber,
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-50 via-amber-50 to-stone-100">
      <header className="relative overflow-hidden shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-800" />
        <div className="relative container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-emerald-50 text-xl sm:text-2xl font-semibold">Student Profile</h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-md border border-emerald-300/30 bg-emerald-50/10 px-3 py-2 text-emerald-50 hover:bg-emerald-50/20"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-sm">
          <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-amber-100 to-emerald-100" />
          {/* Edit button (view mode) */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white/80 px-3 py-1.5 text-sm text-stone-700 shadow hover:bg-white"
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
              <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                disabled={!isEditing}
                className={`w-full rounded-md border px-3 py-2 text-stone-800 placeholder-stone-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isEditing ? 'border-stone-300 bg-white' : 'border-stone-200 bg-stone-100 cursor-default'}`}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={onChange}
                required
                disabled={!isEditing}
                className={`w-full rounded-md border px-3 py-2 text-stone-800 placeholder-stone-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isEditing ? 'border-stone-300 bg-white' : 'border-stone-200 bg-stone-100 cursor-default'}`}
                placeholder="Department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChange}
                required
                disabled={!isEditing}
                pattern="^[0-9+\-()\s]{7,15}$"
                title="Enter a valid phone number"
                className={`w-full rounded-md border px-3 py-2 text-stone-800 placeholder-stone-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isEditing ? 'border-stone-300 bg-white' : 'border-stone-200 bg-stone-100 cursor-default'}`}
                placeholder="Phone Number"
              />
            </div>

            {isEditing && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-emerald-50 shadow hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setForm(initial); setIsEditing(false); setError(''); setSuccess(''); }}
                  className="rounded-md border border-stone-300 bg-white px-4 py-2 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
