const mongoose = require('mongoose');
const https = require('https');
require('dotenv').config({ override: true });
const { config, maskMongoUri } = require('./env');

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
  const srvName = `_mongodb._tcp.${host}`;
  const srvResp = await dohQuery(srvName, 'SRV');
  if (!srvResp || !Array.isArray(srvResp.Answer)) {
    throw new Error('SRV resolution via DoH failed');
  }
  const targets = srvResp.Answer.map(a => a.data)
    .map(s => {
      const parts = s.trim().split(/\s+/);
      const port = parts[2];
      const target = parts[3];
      return `${target.replace(/\.$/, '')}:${port}`;
    });
  const txtResp = await dohQuery(host, 'TXT');
  let txt = '';
  if (txtResp && Array.isArray(txtResp.Answer)) {
    for (const ans of txtResp.Answer) {
      const raw = ans.data.replace(/^\"|\"$/g, '').replace(/\"\s+\"/g, '');
      if (raw.includes('=')) {
        txt = raw;
        break;
      }
    }
  }
  let mergedQuery = [txt, query].filter(Boolean).join('&');
  const ensureParam = (qs, key, value) => (new RegExp(`(?:^|&)${key}=`, 'i').test(qs) ? qs : (qs ? `${qs}&` : '') + `${key}=${value}`);
  mergedQuery = ensureParam(mergedQuery, 'ssl', 'true');
  mergedQuery = ensureParam(mergedQuery, 'tls', 'true');
  mergedQuery = ensureParam(mergedQuery, 'retryWrites', 'true');
  mergedQuery = ensureParam(mergedQuery, 'w', 'majority');
  const auth = (username || password) ? `${encodeURIComponent(username || '')}:${encodeURIComponent(password || '')}@` : '';
  const dbSeg = dbName ? `/${dbName}` : '';
  const querySeg = mergedQuery ? `?${mergedQuery}` : '';
  const seedUri = `mongodb://${auth}${targets.join(',')}${dbSeg}${querySeg}`;
  return seedUri;
}

const connectDB = async () => {
  try {
    let mongoUri = config.MONGODB_URI;
    if (mongoUri && /^mongodb\+srv:/i.test(mongoUri)) {
      console.warn('[DB] SRV URI detected. Resolving via DNS-over-HTTPS to build a seedlist URI...');
      mongoUri = await buildSeedlistFromSrv(mongoUri);
    }
    // Use database name from URI as-is; if none is specified, driver default will be used
    console.log(`[DB] Connecting to: ${maskMongoUri(mongoUri)}`);
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
