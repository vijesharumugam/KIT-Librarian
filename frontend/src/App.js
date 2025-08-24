import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminStudents from './pages/AdminStudents';
import BooksIssued from './pages/BooksIssued';
import BooksOverdue from './pages/BooksOverdue';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import BooksPage from './pages/BooksPage';

// Home component (modern gradient + glassmorphism)
const Home = () => {
  // Place the provided logo at: frontend/public/images/logo.png
  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;
  return (
    <div className="min-h-screen font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-50 via-amber-50 to-stone-100 text-stone-800 flex flex-col">
      {/* Header */}
      <header className="relative overflow-hidden shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-800" />
        <div className="relative container mx-auto px-0 pt-8 pb-10">
          <div className="flex items-center justify-start gap-4 sm:gap-5 md:gap-6 mb-3 sm:mb-4 pl-[10px]">
            <img
              src={logoUrl}
              alt="KIT Logo"
              className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow ring-2 ring-emerald-300/50 object-contain shrink-0 select-none [image-rendering:-webkit-optimize-contrast]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="font-serif text-[1.15rem] xs:text-[1.25rem] sm:text-2xl md:text-4xl font-semibold leading-snug tracking-wide text-emerald-50 text-left">
              KIT - Kalaignarkarunanidhi Institute of Technology
            </h1>
          </div>
          <p className="text-center text-emerald-100/90 text-xs sm:text-sm">An Autonomous Institution | Coimbatore - 641 402</p>
          <p className="mt-1 text-center text-emerald-50/95 text-sm sm:text-base md:text-lg font-serif">Read • Research • Rise</p>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-3 sm:px-4 flex-1 flex items-center">
        <section className="mx-auto max-w-5xl w-full my-6 sm:my-8">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-sm p-4 sm:p-6 md:p-10 text-center">
            <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-amber-100 to-emerald-100 absolute top-0 left-0" />
            <h2 className="font-serif text-lg sm:text-xl md:text-3xl font-semibold mb-1 sm:mb-2 text-stone-900">Welcome to KIT’s Library Assistant</h2>
            <p className="text-stone-700 mb-5 md:mb-8 max-w-3xl mx-auto text-sm sm:text-base">
              Manage books, track students, and streamline library operations with ease.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 md:gap-6">
              <Link
                to="/student/login"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-emerald-50 shadow hover:bg-emerald-800 w-full sm:w-auto"
              >
                Login
              </Link>

              <Link
                to="/student/register"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-5 py-2.5 font-medium text-stone-800 shadow hover:bg-stone-50 w-full sm:w-auto"
              >
                Sign Up
              </Link>
            </div>

            <div className="mt-3 sm:mt-4 flex items-stretch sm:items-center justify-center">
              <Link
                to="/books"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-5 py-2.5 font-medium text-stone-800 shadow hover:bg-stone-50 w-full sm:w-auto"
              >
                View Books
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with wooden shelf */}
      <footer className="mt-auto">
        <div className="shelf-bg h-16 sm:h-20 md:h-24 w-full flex items-end justify-center">
          <p className="mb-2 text-stone-100/90 text-sm md:text-base font-serif text-center">© {new Date().getFullYear()} KIT Library Assistant</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/books" element={<AdminBooks />} />
        <Route path="/admin/dashboard/students" element={<AdminStudents />} />
        <Route path="/admin/dashboard/books-issued" element={<BooksIssued />} />
        <Route path="/admin/dashboard/books-overdue" element={<BooksOverdue />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/books" element={<BooksPage />} />
      </Routes>
    </Router>
  );
}

export default App;
