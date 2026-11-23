/**
 * MongoDB Automated JSON Restore Utility
 * Restores collections from timestamped JSON backups created by backup-db.js.
 * Usage: node scripts/restore-db.js <sourceDir> [--clean]
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');

const restoreDatabase = async () => {
  const args = process.argv.slice(2);
  const cleanFlag = args.includes('--clean');
  const sourceDir = args.find((a) => !a.startsWith('--'));

  if (!sourceDir) {
    console.error('[Restore] Error: Please provide source backup directory.');
    console.error('Usage: node scripts/restore-db.js <sourceDir> [--clean]');
    process.exit(1);
  }

  const resolvedDir = path.resolve(sourceDir);
  if (!fs.existsSync(resolvedDir)) {
    console.error(`[Restore] Error: Source directory "${resolvedDir}" does not exist.`);
    process.exit(1);
  }

  const manifestPath = path.join(resolvedDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`[Restore] Error: manifest.json not found in "${resolvedDir}".`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`[Restore] Found backup manifest from: ${manifest.timestamp}`);
  console.log(`[Restore] Connecting to database...`);

  await connectDB();
  console.log(`[Restore] Connected to database: ${mongoose.connection.name}`);

  for (const [colName, expectedCount] of Object.entries(manifest.collections)) {
    const colFile = path.join(resolvedDir, `${colName}.json`);
    if (!fs.existsSync(colFile)) {
      console.warn(`[Restore] Warning: file "${colFile}" not found, skipping.`);
      continue;
    }

    const rawData = fs.readFileSync(colFile, 'utf-8');
    const documents = JSON.parse(rawData);

    const collection = mongoose.connection.db.collection(colName);

    if (cleanFlag) {
      await collection.deleteMany({});
      console.log(`  - Cleared existing collection "${colName}"`);
    }

    if (documents.length > 0) {
      await collection.insertMany(documents);
      console.log(
        `  - Restored ${documents.length}/${expectedCount} documents to "${colName}"`
      );
    } else {
      console.log(`  - Collection "${colName}" was empty, 0 documents inserted`);
    }
  }

  console.log(`[Restore] Restore completed successfully!`);
  await disconnectDB();
};

if (require.main === module) {
  restoreDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Restore] Restore failed:', err);
      process.exit(1);
    });
}

module.exports = { restoreDatabase };
