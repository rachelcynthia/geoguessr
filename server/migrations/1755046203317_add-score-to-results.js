module.exports.shorthands = undefined;

module.exports.up = (pgm) => {
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

module.exports.down = (pgm) => {
    pgm.dropColumn({ schema: 'geoguessr_schema', name: 'results' }, 'score');
};
