const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const Book = require('./models/Book');
const Student = require('./models/Student');
const Admin = require('./models/Admin');

// Sample data arrays
const sampleBooks = [
  // Programming & Computer Science
  { title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884" },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", isbn: "978-0596517748" },
  { title: "Design Patterns", author: "Gang of Four", isbn: "978-0201633612" },
  { title: "The Pragmatic Programmer", author: "David Thomas", isbn: "978-0201616224" },
  { title: "Code Complete", author: "Steve McConnell", isbn: "978-0735619678" },
  { title: "Refactoring", author: "Martin Fowler", isbn: "978-0201485677" },
  { title: "Head First Design Patterns", author: "Eric Freeman", isbn: "978-0596007126" },
  { title: "Effective Java", author: "Joshua Bloch", isbn: "978-0134685991" },
  { title: "Python Crash Course", author: "Eric Matthes", isbn: "978-1593276034" },
  { title: "Learning React", author: "Alex Banks", isbn: "978-1491954621" },
  
  // Mathematics
  { title: "Calculus", author: "James Stewart", isbn: "978-1285740621" },
  { title: "Linear Algebra", author: "Gilbert Strang", isbn: "978-0980232714" },
  { title: "Discrete Mathematics", author: "Kenneth Rosen", isbn: "978-0073383095" },
  { title: "Statistics", author: "David Freedman", isbn: "978-0393929720" },
  { title: "Probability Theory", author: "E.T. Jaynes", isbn: "978-0521592710" },
  
  // Physics
  { title: "University Physics", author: "Hugh Young", isbn: "978-0321973610" },
  { title: "Principles of Physics", author: "David Halliday", isbn: "978-1118230725" },
  { title: "Classical Mechanics", author: "Herbert Goldstein", isbn: "978-0201657029" },
  { title: "Quantum Mechanics", author: "David Griffiths", isbn: "978-0131118928" },
  { title: "Electrodynamics", author: "David Griffiths", isbn: "978-0138053260" },
  
  // Chemistry
  { title: "General Chemistry", author: "Linus Pauling", isbn: "978-0486656229" },
  { title: "Organic Chemistry", author: "Paula Bruice", isbn: "978-0134042282" },
  { title: "Physical Chemistry", author: "Peter Atkins", isbn: "978-0199697403" },
  { title: "Analytical Chemistry", author: "Gary Christian", isbn: "978-0470887578" },
  { title: "Biochemistry", author: "Jeremy Berg", isbn: "978-1464126109" },
  
  // Engineering
  { title: "Engineering Mechanics", author: "Russell Hibbeler", isbn: "978-0133918922" },
  { title: "Thermodynamics", author: "Yunus Cengel", isbn: "978-0073398174" },
  { title: "Fluid Mechanics", author: "Frank White", isbn: "978-0073398273" },
  { title: "Materials Science", author: "William Callister", isbn: "978-1118324578" },
  { title: "Circuit Analysis", author: "Allan Robbins", isbn: "978-1285965604" },
  
  // Literature & Humanities
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061120084" },
  { title: "1984", author: "George Orwell", isbn: "978-0452284234" },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565" },
  { title: "Hamlet", author: "William Shakespeare", isbn: "978-0486272788" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0316769174" },
  { title: "Lord of the Flies", author: "William Golding", isbn: "978-0571056866" },
  { title: "Jane Eyre", author: "Charlotte Bronte", isbn: "978-0141441146" },
  { title: "Wuthering Heights", author: "Emily Bronte", isbn: "978-0141439556" },
  { title: "The Adventures of Huckleberry Finn", author: "Mark Twain", isbn: "978-0486280615" },
  
  // History & Social Sciences
  { title: "A People's History of the United States", author: "Howard Zinn", isbn: "978-0062397348" },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", isbn: "978-0393317558" },
  { title: "The Wealth of Nations", author: "Adam Smith", isbn: "978-0486412115" },
  { title: "Democracy in America", author: "Alexis de Tocqueville", isbn: "978-0226805368" },
  { title: "The Communist Manifesto", author: "Karl Marx", isbn: "978-0486424651" },
  
  // Business & Economics
  { title: "Think and Grow Rich", author: "Napoleon Hill", isbn: "978-1585424337" },
  { title: "Good to Great", author: "Jim Collins", isbn: "978-0066620992" },
  { title: "The Lean Startup", author: "Eric Ries", isbn: "978-0307887894" },
  { title: "Freakonomics", author: "Steven Levitt", isbn: "978-0060731335" },
  { title: "The Intelligent Investor", author: "Benjamin Graham", isbn: "978-0060555665" },
  
  // Psychology & Philosophy
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0374533557" },
  { title: "The Republic", author: "Plato", isbn: "978-0486411217" },
  { title: "Meditations", author: "Marcus Aurelius", isbn: "978-0486298238" },
  { title: "Beyond Good and Evil", author: "Friedrich Nietzsche", isbn: "978-0486298689" },
  { title: "The Social Animal", author: "David Brooks", isbn: "978-0812979374" }
];

// Generate additional books to reach 200
const generateBooks = () => {
  const books = [...sampleBooks];
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Computer Science', 'Literature', 'History', 'Economics', 'Psychology'];
  const authors = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez', 'William Garcia', 'Mary Rodriguez'];
  
  while (books.length < 200) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const bookNumber = books.length + 1;
    
    books.push({
      title: `${subject} Fundamentals Vol. ${bookNumber}`,
      author: author,
      isbn: `978-${Math.floor(Math.random() * 9000000000) + 1000000000}`
    });
  }
  
  return books;
};

const generateStudents = () => {
  const students = [];
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Mary', 'James', 'Jennifer', 'Christopher', 'Patricia', 'Daniel', 'Linda', 'Matthew', 'Elizabeth', 'Anthony', 'Barbara'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Martinez', 'Garcia', 'Rodriguez', 'Miller', 'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young'];
  
  for (let i = 1; i <= 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const registerNumber = `REG${String(i).padStart(4, '0')}`;
    const phoneNumber = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    students.push({
      registerNumber,
      phoneNumber,
      currentBooks: [] // Initially no books issued
    });
  }
  
  return students;
};

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Book.deleteMany({});
    await Student.deleteMany({});
    await Admin.deleteMany({});
    console.log('Cleared existing data');
    
    // Generate and insert books
    const books = generateBooks();
    await Book.insertMany(books);
    console.log(`Inserted ${books.length} books`);
    
    // Generate and insert students
    const students = generateStudents();
    await Student.insertMany(students);
    console.log(`Inserted ${students.length} students`);
    
    // Create default admin user
    const admin = new Admin({
      username: 'admin',
      password: 'admin123' // This will be hashed automatically
    });
    await admin.save();
    console.log('Created default admin user (username: admin, password: admin123)');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('📚 200 books added');
    console.log('👥 50 students added');
    console.log('👤 1 admin user added');
    console.log('\nTo test the application:');
    console.log('1. Start MongoDB service');
    console.log('2. Run: npm run dev (from root directory)');
    console.log('3. Admin login - username: admin, password: admin123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close connection
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seed function
seedDatabase();
