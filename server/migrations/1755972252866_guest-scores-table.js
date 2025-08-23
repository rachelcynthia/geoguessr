module.exports.shorthands = undefined;

module.exports.up = (pgm) => {
  pgm.createTable({ schema: 'geoguessr_schema', name: 'guest_results' }, {
    id: 'id', // bigserial primary key
    guest_id: { type: 'text', notNull: true },              // use JWT jti
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    expires_at: { type: 'timestamptz', notNull: true },

    guessed_lat: { type: 'double precision' },
    guessed_lng: { type: 'double precision' },
    actual_lat:  { type: 'double precision' },
    actual_lng:  { type: 'double precision' },
    guessed_floor: { type: 'integer' },
    actual_floor:  { type: 'integer' },
    distance_meters: { type: 'double precision' },
    score: { type: 'integer' },
  });

  // Useful indexes
  pgm.createIndex({ schema: 'geoguessr_schema', name: 'guest_results' }, 'guest_id');
  pgm.createIndex({ schema: 'geoguessr_schema', name: 'guest_results' }, 'expires_at');
  pgm.createIndex({ schema: 'geoguessr_schema', name: 'guest_results' }, ['guest_id', { name: 'created_at', sort: 'DESC' }]);
};

module.exports.down = (pgm) => {
    pgm.dropTable({ schema: 'geoguessr_schema', name: 'guest_results' });
};