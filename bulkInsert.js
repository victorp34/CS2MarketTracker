// Construit et exécute un INSERT multi-lignes par lots, pour éviter
// une requête SQL par ligne (catastrophique sur des dizaines de milliers de lignes).
//
// rows : tableau d'objets { col1: val1, col2: val2, ... }
// columns : ordre des colonnes à insérer
// conflictTarget : ex. "(market_hash_name)"
// conflictAction : ex. "DO UPDATE SET market_hash_name = EXCLUDED.market_hash_name"
// returning : ex. "id, market_hash_name" (optionnel)
async function bulkInsert(pool, { table, columns, rows, conflictTarget, conflictAction, returning, batchSize = 1000 }) {
  const allReturned = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const valuesSql = [];
    const params = [];
    let paramIndex = 1;

    for (const row of batch) {
      const placeholders = columns.map(() => `$${paramIndex++}`);
      valuesSql.push(`(${placeholders.join(', ')})`);
      for (const col of columns) params.push(row[col]);
    }

    const conflictClause = conflictTarget
      ? `ON CONFLICT ${conflictTarget} ${conflictAction}`
      : '';
    const returningClause = returning ? `RETURNING ${returning}` : '';

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${valuesSql.join(', ')}
      ${conflictClause}
      ${returningClause}
    `;

    const { rows: result } = await pool.query(sql, params);
    if (returning) allReturned.push(...result);
  }

  return allReturned;
}

module.exports = bulkInsert;
