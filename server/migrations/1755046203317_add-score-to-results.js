/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.addColumn({ schema: 'geoguessr_schema', name: 'results' }, {
    score: { type: 'integer', default: 0, notNull: true }
  });

  // Update existing rows with score logic
  pgm.sql(`
    UPDATE geoguessr_schema.results
    SET score = CASE
      WHEN distance_meters <= 10 THEN 10
      ELSE 0
    END
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumn({ schema: 'geoguessr_schema', name: 'results' }, 'score');
};
