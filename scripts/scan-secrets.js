#!/usr/bin/env node
/*
 Lightweight secret scanner for staged files.
 - Blocks committing .env files
 - Scans staged text files for common secret patterns
*/
const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

function getStagedFiles() {
  const stdout = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf8' });
  return stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

function isBinary(filePath) {
  try {
    const buf = readFileSync(filePath);
    const sample = buf.slice(0, 8000);
    const text = sample.toString('utf8');
    // if it contains many NULs, treat as binary
    const nulCount = (text.match(/\u0000/g) || []).length;
    return nulCount > 0;
  } catch {
    return false;
  }
}

function scanContent(content) {
  const findings = [];
  const patterns = [
    { name: 'Generic API key', re: /(api[_-]?key|access[_-]?key|secret|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}['\"]/gi },
    { name: 'AWS Access Key ID', re: /AKIA[0-9A-Z]{16}/g },
    { name: 'AWS Secret', re: /aws(.{0,20})?(secret|key).{0,3}['\"][A-Za-z0-9\/+]{30,}['\"]/gi },
    { name: 'Private Key', re: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g },
    { name: 'Mongo URI with creds', re: /mongodb(?:\+srv)?:\/\/[^:\/@\s]+:[^@\s]+@/g },
    { name: 'JWT Secret-like', re: /jwt[_-]?(secret|key)\s*[:=]\s*['\"][^'\"]{12,}['\"]/gi },
  ];
  for (const p of patterns) {
    const matches = content.match(p.re);
    if (matches && matches.length) findings.push({ rule: p.name, sample: matches[0].slice(0, 80) });
  }
  return findings;
}

function main() {
  const files = getStagedFiles();
  const errors = [];

  for (const f of files) {
    const rel = f.replace(/\\/g, '/');
    const ext = path.extname(rel).toLowerCase();

    // Block committing .env files
    if (/(^|\/)\.env(\..*)?$/.test(rel)) {
      errors.push(`Do not commit environment files: ${rel}`);
      continue;
    }

    // skip node_modules and binary
    if (/node_modules\//.test(rel)) continue;
    if (!existsSync(rel)) continue;
    if (isBinary(rel)) continue;

    try {
      const content = readFileSync(rel, 'utf8');
      const findings = scanContent(content);
      if (findings.length) {
        findings.forEach((fnd) => {
          errors.push(`${rel}: ${fnd.rule} -> ${fnd.sample}`);
        });
      }
    } catch (e) {
      // ignore file read issues
    }
  }

  if (errors.length) {
    console.error('\nSecret scan failed. Fix the following before committing:\n');
    errors.forEach(e => console.error(' - ' + e));
    console.error('\nTip: move secrets to .env and ensure it is ignored.');
    process.exit(1);
  }
}

main();
