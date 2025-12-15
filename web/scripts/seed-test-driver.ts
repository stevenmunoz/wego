/**
 * Seed Test Driver Script
 *
 * Creates a test driver document in Firestore for testing the external rides form.
 *
 * Usage:
 *   # Using service account key file (recommended):
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed:driver
 *
 *   # Or place the key file in the web directory:
 *   npm run seed:driver
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'wego-dev-a5a13';

// Try to find service account key
function getServiceAccountCredentials() {
  // 1. Check env var
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && existsSync(envPath)) {
    console.log(`📁 Using credentials from: ${envPath}`);
    return cert(envPath);
  }

  // 2. Check common local paths
  const localPaths = [
    './service-account.json',
    './serviceAccountKey.json',
    '../service-account.json',
    `./service-account-${PROJECT_ID}.json`,
  ];

  for (const localPath of localPaths) {
    const fullPath = resolve(process.cwd(), localPath);
    if (existsSync(fullPath)) {
      console.log(`📁 Using credentials from: ${fullPath}`);
      return cert(fullPath);
    }
  }

  // 3. Check if running in GCP environment (Cloud Run, etc.)
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    console.log('☁️  Using default GCP credentials');
    return undefined; // Will use default credentials
  }

  throw new Error(
    'No service account credentials found.\n\n' +
    'Please either:\n' +
    '  1. Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path\n' +
    '  2. Place a service-account.json file in the web directory\n' +
    '  3. Download from: Firebase Console > Project Settings > Service Accounts\n'
  );
}

// Test driver data
const TEST_DRIVER = {
  // Basic info
  name: 'Carlos Test Driver',
  email: 'carlos.test@wego.com',
  phone: '+57 300 123 4567',

  // Slug for public URL
  unique_slug: 'carlos-test',

  // Status
  is_active: true,
  status: 'active',

  // Capabilities
  accepts_pets: true,
  accepts_seniors: true,

  // Metrics
  rating: 4.8,
  total_rides: 150,
  completion_rate: 0.95,

  // Financial
  balance: 250000,
  pending_commissions: 45000,

  // Timestamps
  created_at: Timestamp.now(),
  updated_at: Timestamp.now(),
};

async function seedTestDriver(): Promise<void> {
  console.log('🚀 Starting test driver seed...\n');
  console.log(`📦 Project: ${PROJECT_ID}`);

  try {
    // Get credentials
    const credential = getServiceAccountCredentials();

    // Initialize Firebase Admin
    initializeApp({
      credential,
      projectId: PROJECT_ID,
    });

    const db = getFirestore();

    // Check if driver already exists
    const existingQuery = await db
      .collection('drivers')
      .where('unique_slug', '==', TEST_DRIVER.unique_slug)
      .get();

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      console.log(`\n⚠️  Driver with slug "${TEST_DRIVER.unique_slug}" already exists!`);
      console.log(`   Document ID: ${existingDoc.id}`);
      console.log(`   Name: ${existingDoc.data().name}`);
      console.log('\n✅ No changes made. Use the existing driver for testing.');
      return;
    }

    // Create driver document with a random ID
    const driverRef = db.collection('drivers').doc();
    await driverRef.set(TEST_DRIVER);

    console.log('\n✅ Test driver created successfully!\n');
    console.log('📋 Driver Details:');
    console.log(`   Document ID: ${driverRef.id}`);
    console.log(`   Name: ${TEST_DRIVER.name}`);
    console.log(`   Slug: ${TEST_DRIVER.unique_slug}`);
    console.log(`   Phone: ${TEST_DRIVER.phone}`);
    console.log(`   Active: ${TEST_DRIVER.is_active}`);
    console.log('\n🔗 Public Form URL:');
    console.log(`   https://wego-dev-a5a13.web.app/registrar-viaje/${TEST_DRIVER.unique_slug}`);
    console.log('\n   (Or locally: http://localhost:5173/registrar-viaje/carlos-test)');
  } catch (error) {
    console.error('\n❌ Error seeding test driver:', error);
    process.exit(1);
  }
}

// Run the seed
seedTestDriver();
