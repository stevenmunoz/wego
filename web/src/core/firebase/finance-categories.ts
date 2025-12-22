/**
 * Firestore finance categories service
 *
 * Categories are stored in a top-level collection:
 * - finance_categories/{categoryId}
 *
 * Admin-only write access for managing expense categories and income types.
 * Authenticated users can read categories for forms and charts.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firestore';
import type {
  FinanceCategory,
  FinanceCategoryCreateInput,
  FinanceCategoryUpdateInput,
  FinanceCategoryType,
  FirestoreFinanceCategory,
} from '@/core/types/finance-category.types';

// ============ Helper Functions ============

/**
 * Convert Firestore document to FinanceCategory
 */
function toFinanceCategory(doc: FirestoreFinanceCategory): FinanceCategory {
  return {
    id: doc.id,
    category_type: doc.category_type,
    key: doc.key,
    label: doc.label,
    color: doc.color,
    sort_order: doc.sort_order,
    is_active: doc.is_active,
    created_at: doc.created_at.toDate(),
    updated_at: doc.updated_at.toDate(),
  };
}

// ============ Read Operations ============

/**
 * Get all finance categories
 */
export async function getFinanceCategories(): Promise<FinanceCategory[]> {
  const categoriesCollection = collection(db, 'finance_categories');
  const q = query(categoriesCollection, orderBy('category_type'), orderBy('sort_order'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => toFinanceCategory(doc.data() as FirestoreFinanceCategory));
}

/**
 * Get categories by type (expense or income)
 */
export async function getCategoriesByType(
  categoryType: FinanceCategoryType
): Promise<FinanceCategory[]> {
  const categoriesCollection = collection(db, 'finance_categories');
  const q = query(
    categoriesCollection,
    where('category_type', '==', categoryType),
    orderBy('sort_order')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => toFinanceCategory(doc.data() as FirestoreFinanceCategory));
}

/**
 * Get active categories by type (for form dropdowns)
 */
export async function getActiveCategoriesByType(
  categoryType: FinanceCategoryType
): Promise<FinanceCategory[]> {
  const categoriesCollection = collection(db, 'finance_categories');
  const q = query(
    categoriesCollection,
    where('category_type', '==', categoryType),
    where('is_active', '==', true),
    orderBy('sort_order')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => toFinanceCategory(doc.data() as FirestoreFinanceCategory));
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(categoryId: string): Promise<FinanceCategory | null> {
  const categoryRef = doc(db, 'finance_categories', categoryId);
  const snapshot = await getDoc(categoryRef);

  if (!snapshot.exists()) {
    return null;
  }

  return toFinanceCategory(snapshot.data() as FirestoreFinanceCategory);
}

/**
 * Get a category by key and type
 */
export async function getCategoryByKey(
  key: string,
  categoryType: FinanceCategoryType
): Promise<FinanceCategory | null> {
  const categoriesCollection = collection(db, 'finance_categories');
  const q = query(
    categoriesCollection,
    where('key', '==', key),
    where('category_type', '==', categoryType)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  return toFinanceCategory(snapshot.docs[0].data() as FirestoreFinanceCategory);
}

/**
 * Check if a category key already exists for a given type
 */
export async function categoryKeyExists(
  key: string,
  categoryType: FinanceCategoryType,
  excludeId?: string
): Promise<boolean> {
  const category = await getCategoryByKey(key, categoryType);
  if (!category) return false;
  if (excludeId && category.id === excludeId) return false;
  return true;
}

// ============ Write Operations (Admin only) ============

/**
 * Create a new finance category
 */
export async function createFinanceCategory(
  input: FinanceCategoryCreateInput
): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  try {
    // Check if key already exists
    const exists = await categoryKeyExists(input.key, input.category_type);
    if (exists) {
      return { success: false, error: 'Ya existe una categoría con esta clave' };
    }

    const categoriesCollection = collection(db, 'finance_categories');
    const categoryRef = doc(categoriesCollection);
    const now = Timestamp.now();

    // Calculate sort_order if not provided
    let sortOrder = input.sort_order;
    if (sortOrder === undefined) {
      const existingCategories = await getCategoriesByType(input.category_type);
      const maxSortOrder = existingCategories.reduce((max, c) => Math.max(max, c.sort_order), -10);
      sortOrder = maxSortOrder + 10;
    }

    const category: FirestoreFinanceCategory = {
      id: categoryRef.id,
      category_type: input.category_type,
      key: input.key.toLowerCase().replace(/\s+/g, '_'),
      label: input.label,
      color: input.color,
      sort_order: sortOrder,
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    await setDoc(categoryRef, category);

    return { success: true, categoryId: categoryRef.id };
  } catch (error) {
    console.error('[finance-categories] Error creating category:', error);
    const message = error instanceof Error ? error.message : 'Error al crear categoría';
    return { success: false, error: message };
  }
}

/**
 * Update an existing finance category
 */
export async function updateFinanceCategory(
  categoryId: string,
  updates: FinanceCategoryUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const categoryRef = doc(db, 'finance_categories', categoryId);

    const updateData: Record<string, unknown> = {
      updated_at: Timestamp.now(),
    };

    if (updates.label !== undefined) {
      updateData.label = updates.label;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }
    if (updates.sort_order !== undefined) {
      updateData.sort_order = updates.sort_order;
    }
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }

    await updateDoc(categoryRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('[finance-categories] Error updating category:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar categoría';
    return { success: false, error: message };
  }
}

/**
 * Delete a finance category (hard delete)
 * Note: Use updateFinanceCategory with is_active: false for soft delete
 */
export async function deleteFinanceCategory(
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const categoryRef = doc(db, 'finance_categories', categoryId);
    await deleteDoc(categoryRef);

    return { success: true };
  } catch (error) {
    console.error('[finance-categories] Error deleting category:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar categoría';
    return { success: false, error: message };
  }
}

/**
 * Toggle category active status
 */
export async function toggleCategoryActive(
  categoryId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateFinanceCategory(categoryId, { is_active: isActive });
}

// ============ Bulk Operations ============

/**
 * Seed default categories (for initial setup)
 * Only creates categories that don't already exist
 */
export async function seedDefaultCategories(
  defaults: Array<{
    category_type: FinanceCategoryType;
    key: string;
    label: string;
    color: string;
    sort_order: number;
  }>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const defaultCat of defaults) {
    const exists = await categoryKeyExists(defaultCat.key, defaultCat.category_type);
    if (exists) {
      skipped++;
      continue;
    }

    const result = await createFinanceCategory({
      category_type: defaultCat.category_type,
      key: defaultCat.key,
      label: defaultCat.label,
      color: defaultCat.color,
      sort_order: defaultCat.sort_order,
      is_active: true,
    });

    if (result.success) {
      created++;
    } else {
      errors.push(`${defaultCat.key}: ${result.error}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Reorder categories by updating sort_order
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = orderedIds.map((id, index) =>
      updateFinanceCategory(id, { sort_order: index * 10 })
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => !r.success);

    if (failed) {
      return { success: false, error: failed.error };
    }

    return { success: true };
  } catch (error) {
    console.error('[finance-categories] Error reordering categories:', error);
    const message = error instanceof Error ? error.message : 'Error al reordenar categorías';
    return { success: false, error: message };
  }
}
