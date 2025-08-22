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
import BooksPage from './pages/BooksPage';

// Home component
const Home = () => (
  <div className="min-h-screen bg-gray-100">
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">Kit Librarian</h1>
        <p className="text-blue-100 mt-2">Manage your kits and libraries efficiently</p>
      </div>
    </header>
    
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Kit Librarian</h2>
        <p className="text-gray-600 mb-6">
          Your MERN stack application is up and running! This is your starting point for building
          a comprehensive kit and library management system.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Frontend</h3>
            <p className="text-blue-600">React with TailwindCSS running on port 3000</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800 mb-2">Backend</h3>
            <p className="text-green-600">Express server running on port 5000</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link 
            to="/admin/login" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Admin Login
          </Link>
          <Link 
            to="/student/login" 
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Student Login
          </Link>
          <Link 
            to="/books" 
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Books
          </Link>
        </div>
      </div>
    </main>
  </div>
);

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
        <Route path="/books" element={<BooksPage />} />
      </Routes>
    </Router>
  );
}

export default App;
