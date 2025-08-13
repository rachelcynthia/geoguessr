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
    pgm.createSchema('geoguessr_schema', { ifNotExists: true });
    pgm.createTable({ schema: 'geoguessr_schema', name: 'users' }, {
        id: 'id',
        email: { type: 'varchar(255)', notNull: true, unique: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        name: { type: 'varchar(100)', notNull: true },
        city: { type: 'varchar(100)' },
        country: { type: 'varchar(100)' }
    });

    pgm.createTable({ schema: 'geoguessr_schema', name: 'results' }, {
        id: 'id',
        user_id: {
            type: 'integer',
            references: { schema: 'geoguessr_schema', name: 'users' },
            onDelete: 'CASCADE',
            notNull: true
        },
        guessed_lat: { type: 'float8', notNull: true },
        guessed_lng: { type: 'float8', notNull: true },
        actual_lat: { type: 'float8', notNull: true },
        actual_lng: { type: 'float8', notNull: true },
        guessed_floor: { type: 'integer' },
        actual_floor: { type: 'integer' },
        distance_meters: { type: 'float8' },
        created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('results');
    pgm.dropTable('users');
};
