module.exports.shorthands = undefined;

module.exports.up = (pgm) => {
    pgm.sql(`
    UPDATE geoguessr_schema.results
    SET score = 0;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
module.exports.down = (pgm) => {};
