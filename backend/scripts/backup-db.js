/**
 * MongoDB Automated JSON Backup Utility
 * Exports all platform collections to structured timestamped JSON backups.
 * Usage: node scripts/backup-db.js [targetDir]
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');

const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir =
    process.argv[2] || path.join(__dirname, '..', 'backups', `backup-${timestamp}`);

  console.log(`[Backup] Initializing MongoDB backup process...`);
  console.log(`[Backup] Target directory: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  await connectDB();
  console.log(`[Backup] Connected to database: ${mongoose.connection.name}`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  const manifest = {
    database: mongoose.connection.name,
    timestamp: new Date().toISOString(),
    collections: {},
    totalDocuments: 0,
  };

  for (const col of collections) {
    const colName = col.name;
    // Skip internal system collections
    if (colName.startsWith('system.')) continue;

    const documents = await mongoose.connection.db.collection(colName).find({}).toArray();
    const filePath = path.join(targetDir, `${colName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8');
    manifest.collections[colName] = documents.length;
    manifest.totalDocuments += documents.length;

    console.log(`  - Exported collection "${colName}": ${documents.length} documents`);
  }

  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log(
    `[Backup] Backup completed successfully! Total documents backed up: ${manifest.totalDocuments}`
  );

  await disconnectDB();
};

if (require.main === module) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Backup] Backup failed:', err);
      process.exit(1);
    });
}

module.exports = { backupDatabase };
