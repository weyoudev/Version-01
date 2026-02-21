#!/usr/bin/env node
'use strict';
/**
 * Vercel build: if VERCEL_ADMIN_ONLY is set (Admin-only project), run only Next build.
 * Otherwise run full monorepo build (prisma, API, then Next).
 */
const { execSync } = require('child_process');
const path = require('path');

const isAdminOnly = process.env.VERCEL_ADMIN_ONLY === '1' || process.env.VERCEL_ADMIN_ONLY === 'true';

if (isAdminOnly) {
  execSync('npm run build -w admin-web', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} else {
  execSync('npm run prisma:generate && npm run build:api', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  execSync('node scripts/vercel-build-admin.js', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}
