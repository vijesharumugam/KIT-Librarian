import React from 'react';

// Subtle floating decorative SVGs/background orbs for dark/glass theme pages
// Positioned absolutely and non-interactive.
const FloatingDecor = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Very subtle global radial wash */}
      <div className="absolute inset-0 opacity-70 mix-blend-screen" style={{
        background: 'radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(1000px 500px at 90% 20%, rgba(139,92,246,0.10), transparent 55%), radial-gradient(900px 450px at 50% 90%, rgba(236,72,153,0.08), transparent 60%)'
      }} />
      {/* Soft gradient blobs */}
      <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute top-24 -right-20 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

      {/* Floating icons - light stroke, very subtle */}
      <svg
        className="absolute left-10 top-24 h-9 w-9 text-indigo-300/30 float-slow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <path d="M4 5.5a2 2 0 012-2h10.5v13H6a2 2 0 00-2 2V5.5z" />
        <path d="M6 3.5v13" />
        <path d="M8 6.5h7" />
        <path d="M8 9.5h7" />
      </svg>

      <svg
        className="absolute right-10 top-16 h-11 w-11 text-blue-300/30 float-medium delay-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <path d="M5 5.5h9a3 3 0 013 3v9H8a3 3 0 01-3-3v-9z" />
        <path d="M8 8.5h6" />
        <path d="M8 11.5h6" />
      </svg>

      <svg
        className="absolute left-16 bottom-16 h-10 w-10 text-pink-300/30 float-fast delay-1000"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <path d="M4 7.5l8-3 8 3v9l-8 3-8-3v-9z" />
        <path d="M12 4.5v12" />
        <path d="M7 10h10" />
      </svg>

      {/* Ring outline */}
      <svg
        className="absolute right-1/3 top-1/2 h-12 w-12 text-indigo-200/25 spin-very-slow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>

      {/* Star outline */}
      <svg
        className="absolute left-8 top-1/2 h-8 w-8 text-violet-200/25 float-medium delay-1500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        aria-hidden="true"
      >
        <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3z" />
      </svg>

      {/* Tiny twinkles */}
      <div className="absolute left-1/4 top-10 h-2 w-2 rounded-full bg-white/30 twinkle" />
      <div className="absolute right-1/4 top-1/3 h-1.5 w-1.5 rounded-full bg-white/20 twinkle-slow" />
      <div className="absolute left-1/2 bottom-1/4 h-1.5 w-1.5 rounded-full bg-white/25 twinkle" />
      <div className="absolute right-1/5 bottom-1/3 h-1.5 w-1.5 rounded-full bg-white/25 twinkle-slow" />
      <div className="absolute left-8 bottom-1/5 h-1.5 w-1.5 rounded-full bg-white/30 twinkle" />
      <div className="absolute right-10 top-10 h-2 w-2 rounded-full bg-white/25 twinkle" />
    </div>
  );
};

export default FloatingDecor;
