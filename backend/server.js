const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const https = require('https');
require('dotenv').config({ override: true });
const { config, maskMongoUri } = require('./config/env');

const app = express();
const PORT = process.env.PORT || config.PORT;

// Middleware
app.use(cookieParser());
const allowedOrigins = [
  config.CLIENT_ORIGIN,
  'http://localhost:3000',
  'https://kit-librarian.onrender.com' // Update with your Render frontend URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SRV -> seedlist resolution using DNS-over-HTTPS (to bypass blocked SRV DNS) ---

function dohQuery(name, type) {
  const url = `https://1.1.1.1/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'accept': 'application/dns-json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function parseSrvUri(srvUri) {
  // Basic parser for mongodb+srv://user:pass@host/db?query
  const withoutScheme = srvUri.replace(/^mongodb\+srv:\/\//i, '');
  const atIdx = withoutScheme.indexOf('@');
  let creds = null;
  let rest = withoutScheme;
  if (atIdx !== -1) {
    creds = withoutScheme.slice(0, atIdx);
    rest = withoutScheme.slice(atIdx + 1);
  }
  const slashIdx = rest.indexOf('/');
  const host = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
  const pathAndQuery = slashIdx === -1 ? '' : rest.slice(slashIdx + 1);
  const qIdx = pathAndQuery.indexOf('?');
  const dbName = qIdx === -1 ? pathAndQuery : pathAndQuery.slice(0, qIdx);
  const query = qIdx === -1 ? '' : pathAndQuery.slice(qIdx + 1);
  let username = null;
  let password = null;
  if (creds) {
    const [u, p] = creds.split(':');
    username = u ? decodeURIComponent(u) : null;
    password = p ? decodeURIComponent(p) : null;
  }
  return { host, dbName, query, username, password };
}

async function buildSeedlistFromSrv(srvUri) {
  const { host, dbName, query, username, password } = parseSrvUri(srvUri);
  // Resolve SRV records for hosts
  const srvName = `_mongodb._tcp.${host}`;
  const srvResp = await dohQuery(srvName, 'SRV');
  if (!srvResp || !Array.isArray(srvResp.Answer)) {
    throw new Error('SRV resolution via DoH failed');
  }
  const targets = srvResp.Answer.map(a => a.data)
    .map(s => {
      // SRV data format: priority weight port target.
      const parts = s.trim().split(/\s+/);
      const port = parts[2];
      const target = parts[3];
      return `${target.replace(/\.$/, '')}:${port}`;
    });
  // Resolve TXT for replicaSet/authSource
  const txtResp = await dohQuery(host, 'TXT');
  let txt = '';
  if (txtResp && Array.isArray(txtResp.Answer)) {
    // Atlas provides key=value pairs, usually wrapped in quotes possibly split
    // Join all strings for safety and pick the first entry containing '='
    for (const ans of txtResp.Answer) {
      const raw = ans.data.replace(/^\"|\"$/g, '').replace(/\"\s+\"/g, '');
      if (raw.includes('=')) {
        txt = raw;
        break;
      }
    }
  }
  // Merge query params: TXT first (driver-required), then original query
  let mergedQuery = [txt, query].filter(Boolean).join('&');
  // Ensure TLS/SSL and retryWrites/w are present for Atlas when missing
  const ensureParam = (qs, key, value) => (new RegExp(`(?:^|&)${key}=`, 'i').test(qs) ? qs : (qs ? `${qs}&` : '') + `${key}=${value}`);
  mergedQuery = ensureParam(mergedQuery, 'ssl', 'true');
  mergedQuery = ensureParam(mergedQuery, 'tls', 'true'); // some drivers honor tls
  mergedQuery = ensureParam(mergedQuery, 'retryWrites', 'true');
  mergedQuery = ensureParam(mergedQuery, 'w', 'majority');
  // Rebuild mongodb:// URI
  const auth = (username || password) ? `${encodeURIComponent(username || '')}:${encodeURIComponent(password || '')}@` : '';
  const dbSeg = dbName ? `/${dbName}` : '';
  const querySeg = mergedQuery ? `?${mergedQuery}` : '';
  const seedUri = `mongodb://${auth}${targets.join(',')}${dbSeg}${querySeg}`;
  return seedUri;
}

// MongoDB connection
const connectDB = async () => {
  try {
    // Prefer Atlas when MONGODB_URI is provided; fallback to local only if not set
    let mongoUri = config.MONGODB_URI;
    // If SRV is used, convert to seedlist via DoH to avoid local SRV DNS dependency
    if (mongoUri && /^mongodb\+srv:/i.test(mongoUri)) {
      console.warn('[DB] SRV URI detected. Resolving via DNS-over-HTTPS to build a seedlist URI...');
      try {
        mongoUri = await buildSeedlistFromSrv(mongoUri);
        console.warn('[DB] Converted SRV URI to standard seedlist for this process. Consider switching to the non-SRV connection string in production.');
      } catch (e) {
        console.error('[DB] Failed to resolve SRV via DoH:', e);
        throw e;
      }
    }
    if (!process.env.MONGODB_URI) {
      console.warn('[DB] MONGODB_URI not set. Falling back to local MongoDB at 127.0.0.1:27017/kit-librarian');
    }

    // Mask credentials in logs
    const masked = maskMongoUri(mongoUri);
    console.log(`[DB] Connecting to: ${masked}`);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('\nHints:\n- If you see querySrv errors, an Atlas SRV URI may be in MONGODB_URI and DNS is blocked.\n- For local dev, set USE_LOCAL_DB=true (in environment) or unset MONGODB_URI.');
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const booksRoutes = require('./routes/booksRoutes');
const transactionsRoutes = require('./routes/transactionsRoutes');
const studentsController = require('./controllers/studentsController');
const authMiddleware = require('./middleware/authMiddleware');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Kit Librarian API is running!' });
});

// Use admin routes
app.use('/api/admin', adminRoutes);
// Use student routes
app.use('/api/student', studentRoutes);
// Use books routes
app.use('/api/books', booksRoutes);
// Use transactions routes
app.use('/api/transactions', transactionsRoutes);
// Simple students list route (admin only)
app.get('/api/students', authMiddleware, studentsController.listStudents);

// Start retention/anonymization scheduler
try {
  const { startRetentionScheduler } = require('./jobs/retentionJob');
  startRetentionScheduler();
} catch (e) {
  console.warn('[Retention] Scheduler not started:', e?.message || e);
}

// Start notifications scheduler (due/overdue email reminders)
try {
  const { startNotificationsScheduler } = require('./jobs/notificationsJob');
  startNotificationsScheduler();
} catch (e) {
  console.warn('[Notifications] Scheduler not started:', e?.message || e);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
