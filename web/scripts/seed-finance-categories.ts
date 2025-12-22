/**
 * Seed Finance Categories Script
 *
 * Seeds default expense categories (10) and income types (4) to Firestore.
 *
 * Usage:
 *   # Using service account key file (recommended):
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed:categories
 *
 *   # Or place the key file in the web directory:
 *   npm run seed:categories
 *
 *   # Specify environment:
 *   FIREBASE_PROJECT_ID=wego-bac88 npm run seed:categories
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { existsSync } from 'fs';
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

  // 3. Check if running in GCP environment or has ADC configured
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_APPLICATION_CREDENTIALS === '') {
    console.log('☁️  Using application default credentials');
    return applicationDefault();
  }

  throw new Error(
    'No service account credentials found.\n\n' +
    'Please either:\n' +
    '  1. Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path\n' +
    '  2. Place a service-account.json file in the web directory\n' +
    '  3. Download from: Firebase Console > Project Settings > Service Accounts\n'
  );
}

// Default expense categories (10)
const DEFAULT_EXPENSE_CATEGORIES = [
  { key: 'fuel', label: 'Combustible', color: '#ef4444', sort_order: 1 },
  { key: 'maintenance', label: 'Mantenimiento', color: '#f97316', sort_order: 2 },
  { key: 'insurance_soat', label: 'SOAT', color: '#84cc16', sort_order: 3 },
  { key: 'tecnomecanica', label: 'Tecnomecánica', color: '#22c55e', sort_order: 4 },
  { key: 'taxes', label: 'Impuestos', color: '#14b8a6', sort_order: 5 },
  { key: 'fines', label: 'Multas', color: '#06b6d4', sort_order: 6 },
  { key: 'parking', label: 'Parqueadero', color: '#0ea5e9', sort_order: 7 },
  { key: 'car_wash', label: 'Lavado', color: '#3b82f6', sort_order: 8 },
  { key: 'accessories', label: 'Accesorios', color: '#8b5cf6', sort_order: 9 },
  { key: 'other', label: 'Otro', color: '#6b7280', sort_order: 10 },
];

// Default income types (4)
const DEFAULT_INCOME_TYPES = [
  { key: 'weekly_payment', label: 'Pago Semanal', color: '#16a34a', sort_order: 1 },
  { key: 'tip_share', label: 'Propinas', color: '#0ea5e9', sort_order: 2 },
  { key: 'bonus', label: 'Bono', color: '#f59e0b', sort_order: 3 },
  { key: 'other', label: 'Otro', color: '#6b7280', sort_order: 4 },
];

interface CategoryData {
  category_type: 'expense' | 'income';
  key: string;
  label: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

async function seedFinanceCategories(): Promise<void> {
  console.log('🚀 Starting finance categories seed...\n');
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
    const batch = db.batch();
    const now = Timestamp.now();

    // Check existing categories
    const existingSnapshot = await db.collection('finance_categories').get();
    const existingKeys = new Set(existingSnapshot.docs.map(doc => doc.data().key));

    console.log(`\n📊 Found ${existingSnapshot.size} existing categories`);

    let expensesAdded = 0;
    let incomeAdded = 0;
    let skipped = 0;

    // Seed expense categories
    console.log('\n💸 Seeding expense categories...');
    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      if (existingKeys.has(cat.key)) {
        console.log(`   ⏭️  Skipping "${cat.label}" (already exists)`);
        skipped++;
        continue;
      }

      const docRef = db.collection('finance_categories').doc();
      const data: CategoryData = {
        category_type: 'expense',
        key: cat.key,
        label: cat.label,
        color: cat.color,
        sort_order: cat.sort_order,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      batch.set(docRef, data);
      console.log(`   ✅ Adding "${cat.label}" (${cat.key})`);
      expensesAdded++;
    }

    // Seed income types
    console.log('\n💰 Seeding income types...');
    for (const cat of DEFAULT_INCOME_TYPES) {
      if (existingKeys.has(cat.key)) {
        console.log(`   ⏭️  Skipping "${cat.label}" (already exists)`);
        skipped++;
        continue;
      }

      const docRef = db.collection('finance_categories').doc();
      const data: CategoryData = {
        category_type: 'income',
        key: cat.key,
        label: cat.label,
        color: cat.color,
        sort_order: cat.sort_order,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      batch.set(docRef, data);
      console.log(`   ✅ Adding "${cat.label}" (${cat.key})`);
      incomeAdded++;
    }

    // Commit batch
    if (expensesAdded > 0 || incomeAdded > 0) {
      await batch.commit();
      console.log('\n✅ Finance categories seeded successfully!\n');
    } else {
      console.log('\n✅ No new categories to add.\n');
    }

    console.log('📋 Summary:');
    console.log(`   Expense categories added: ${expensesAdded}`);
    console.log(`   Income types added: ${incomeAdded}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    console.log(`   Total in database: ${existingSnapshot.size + expensesAdded + incomeAdded}`);

    console.log('\n🔗 Admin UI:');
    if (PROJECT_ID.includes('dev')) {
      console.log('   https://wego-dev-a5a13.web.app/admin/categories');
    } else {
      console.log('   https://wego-bac88.web.app/admin/categories');
    }
    console.log('\n   (Or locally: http://localhost:5173/admin/categories)');

  } catch (error) {
    console.error('\n❌ Error seeding finance categories:', error);
    process.exit(1);
  }
}

// Run the seed
seedFinanceCategories();
