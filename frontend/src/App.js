import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminStudents from './pages/AdminStudents';
import BooksIssued from './pages/BooksIssued';
import BooksOverdue from './pages/BooksOverdue';
import ProtectedRoute from './components/ProtectedRoute';
import StudentProtectedRoute from './components/StudentProtectedRoute';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import BooksPage from './pages/BooksPage';

// Home component (library themed landing)
const Home = () => {
  // Place the provided logo at: frontend/public/images/logo.png
  const logoUrl = `${process.env.PUBLIC_URL}/images/logo.png`;
  return (
    <div className="min-h-screen font-sans lib-bg text-stone-800 flex flex-col">
      {/* Header */}
      <header className="relative overflow-hidden shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-stone-800" />
        <div className="relative container mx-auto px-3 sm:px-4 pt-6 pb-7">
          <div className="flex items-center gap-4 mb-2">
            <img
              src={logoUrl}
              alt="KIT Logo"
              className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-white shadow ring-2 ring-amber-300/60 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h1 className="font-serif-academic text-xl sm:text-2xl md:text-3xl font-bold tracking-wide text-amber-100">
                KIT - Kalaignarkarunanidhi Institute of Technology
              </h1>
              <p className="text-amber-50/90 text-xs sm:text-sm">An Autonomous Institution | Coimbatore - 641 402</p>
              <p className="text-amber-50/95 text-xs sm:text-sm">Read • Research • Rise</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-3 sm:px-4 flex-1 flex items-center">
        <section className="mx-auto max-w-5xl w-full my-6 sm:my-10">
          <div className="book-card rounded-xl p-5 sm:p-8 md:p-10 text-center border-gold">
            <h2 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-gold-700">
              Welcome to KIT's Library Assistant
            </h2>
            <p className="text-stone-700 mt-2 mb-5 md:mb-6 max-w-3xl mx-auto text-sm sm:text-base">
              Manage books, track students, and streamline library operations with the elegance and precision of a master librarian.
            </p>

            <div className="divider-gold my-5" />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 md:gap-6">
              <Link
                to="/student/login"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-6 py-2.5 font-medium text-emerald-50 shadow hover:bg-emerald-800 w-full sm:w-auto"
              >
                <span className="inline-block">✔</span> Login
              </Link>

              <Link
                to="/student/register"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-6 py-2.5 font-medium text-stone-800 shadow hover:bg-stone-50 w-full sm:w-auto"
              >
                Sign Up
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <Link
                to="/books"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-700/40 bg-white px-6 py-2.5 font-medium text-stone-800 shadow hover:bg-stone-50"
              >
                <span className="text-lg">📚</span> View Books Collection
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with wooden shelf */}
      <footer className="mt-auto">
        <div className="shelf-bg h-20 md:h-24 w-full flex flex-col items-center justify-end">
          <p className="mb-1 text-stone-100/90 text-sm md:text-base font-serif-academic text-center">© {new Date().getFullYear()} KIT Library Assistant</p>
          <p className="mb-3 text-stone-200/80 text-[11px] md:text-sm italic text-center max-w-3xl px-3">
            "A library is not a luxury but one of the necessities of life" — Henry Ward Beecher
          </p>
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
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/books" element={<ProtectedRoute><AdminBooks /></ProtectedRoute>} />
        <Route path="/admin/dashboard/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/dashboard/books-issued" element={<ProtectedRoute><BooksIssued /></ProtectedRoute>} />
        <Route path="/admin/dashboard/books-overdue" element={<ProtectedRoute><BooksOverdue /></ProtectedRoute>} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />
        <Route path="/student/profile" element={<StudentProtectedRoute><StudentProfile /></StudentProtectedRoute>} />
        <Route path="/books" element={<BooksPage />} />
      </Routes>
    </Router>
  );
}

export default App;
