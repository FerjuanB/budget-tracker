// Script to update all API routes to Auth.js v5
const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\Fernando\\Documents\\FerJuan\\budget-tracker';
const apiDir = path.join(projectRoot, 'src', 'app', 'api');

// Files to skip (already handled)
const skipFiles = [
  'auth\\[...nextauth]\\route.ts',
  'auth\\register\\route.ts',
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Skip if already updated
  if (content.includes('getAuthenticatedUser')) {
    console.log(`⏭️  Skipped (already updated): ${filePath}`);
    return false;
  }

  // Replace imports
  if (content.includes("import { getServerSession } from 'next-auth'")) {
    content = content.replace(
      /import { getServerSession } from 'next-auth'/g,
      ''
    );
    updated = true;
  }

  if (content.includes("import { authOptions } from '@/lib/auth'")) {
    content = content.replace(
      /import { authOptions } from '@\/lib\/auth'/g,
      ''
    );
    updated = true;
  }

  // Add new import at the top (after NextRequest/NextResponse)
  if (!content.includes('getAuthenticatedUser')) {
    content = content.replace(
      /(import { NextRequest, NextResponse } from 'next\/server')/,
      `$1\nimport { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'`
    );
    updated = true;
  }

  // Replace session checks
  content = content.replace(
    /const session = await getServerSession\(authOptions\)\s*\n\s*if \(!session\?\.user\?\.id\) {\s*return NextResponse\.json\(\s*{ error: 'Unauthorized' },\s*{ status: 401 }\s*\)\s*}/g,
    'const user = await getAuthenticatedUser()\n    if (!user) return unauthorizedResponse()'
  );

  // Replace session.user.id with user.id
  content = content.replace(/session\.user\.id/g, 'user.id');
  content = content.replace(/session\.user\.email/g, 'user.email');
  content = content.replace(/session\.user\.name/g, 'user.name');

  // Clean up multiple empty lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }

  return false;
}

function walkDir(dir) {
  let files = fs.readdirSync(dir);
  let updatedCount = 0;

  for (let file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(apiDir, filePath);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updatedCount += walkDir(filePath);
    } else if (file === 'route.ts' && !skipFiles.some(skip => relativePath.includes(skip))) {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    }
  }

  return updatedCount;
}

console.log('🚀 Starting Auth.js v5 migration...\n');
const count = walkDir(apiDir);
console.log(`\n✨ Migration complete! Updated ${count} files.`);
