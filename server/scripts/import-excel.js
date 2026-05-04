import path from 'path';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import { pool } from '../src/db.js';

dotenv.config();

const excelPath = process.argv[2] || path.resolve('menu_paradise_inn_extrait (2).xlsx');
const workbook = xlsx.readFile(excelPath);
const rows = xlsx.utils.sheet_to_json(workbook.Sheets.Menu, { defval: null });

const categoryCache = new Map();
const subcategoryCache = new Map();

async function upsertCategory(row, sortOrder) {
  const nameFr = row['Catégorie FR'];
  if (!nameFr) return null;

  if (!categoryCache.has(nameFr)) {
    await pool.query(
      `INSERT INTO categories (name_fr, name_ar, sort_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name_ar = VALUES(name_ar), sort_order = LEAST(sort_order, VALUES(sort_order))`,
      [nameFr, row['الفئة AR'], sortOrder]
    );
    const [[category]] = await pool.query('SELECT id FROM categories WHERE name_fr = ?', [nameFr]);
    categoryCache.set(nameFr, category.id);
  }

  return categoryCache.get(nameFr);
}

async function upsertSubcategory(row, categoryId, sortOrder) {
  const nameFr = row['Sous-catégorie FR'];
  if (!nameFr || !categoryId) return null;

  const key = `${categoryId}:${nameFr}`;
  if (!subcategoryCache.has(key)) {
    await pool.query(
      `INSERT INTO subcategories (category_id, name_fr, name_ar, sort_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name_ar = VALUES(name_ar), sort_order = LEAST(sort_order, VALUES(sort_order))`,
      [categoryId, nameFr, row['الفئة الفرعية AR'], sortOrder]
    );
    const [[subcategory]] = await pool.query(
      'SELECT id FROM subcategories WHERE category_id = ? AND name_fr = ?',
      [categoryId, nameFr]
    );
    subcategoryCache.set(key, subcategory.id);
  }

  return subcategoryCache.get(key);
}

let imported = 0;
for (const [index, row] of rows.entries()) {
  if (!row['Nom FR']) continue;

  const categoryId = await upsertCategory(row, index);
  const subcategoryId = await upsertSubcategory(row, categoryId, index);

  await pool.query(
    `INSERT INTO dishes
      (category_id, subcategory_id, name_fr, name_ar, description_fr, description_ar, price, note, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      name_ar = VALUES(name_ar),
      description_fr = VALUES(description_fr),
      description_ar = VALUES(description_ar),
      price = VALUES(price),
      note = VALUES(note),
      sort_order = VALUES(sort_order),
      is_active = 1`,
    [
      categoryId,
      subcategoryId,
      row['Nom FR'],
      row['الاسم AR'],
      row['Description FR'],
      row['الوصف AR'],
      row['Prix (Dhs)'] || 0,
      row.Note,
      index
    ]
  );
  imported += 1;
}

await pool.end();
console.log(`${imported} plats importes depuis ${excelPath}`);
