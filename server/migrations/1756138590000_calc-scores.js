module.exports.shorthands = undefined;

module.exports.up = (pgm) => {
    // 1) Add difficulty column with default 'easy'
    pgm.addColumn({ schema: 'geoguessr_schema', name: 'results' }, {
        difficulty: { type: 'text', notNull: true, default: 'easy' },
    });

    // 2) Add CHECK constraint so only easy/medium/hard are allowed
    pgm.addConstraint(
        { schema: 'geoguessr_schema', name: 'results' },
        'difficulty_check',
        "CHECK (difficulty IN ('easy', 'medium', 'hard'))"
    );

    // 3) Create / replace scoring function
    pgm.sql(`
    CREATE OR REPLACE FUNCTION geoguessr_schema.calc_score(
      distance_meters NUMERIC,
      guess_floor INT,
      truth_floor INT,
      difficulty TEXT
    ) RETURNS INT
    LANGUAGE plpgsql
    AS $$
    DECLARE
      scale_meters NUMERIC;
      floor_penalty INT;
      max_points INT;
      floor_mismatch_penalty INT := 0;
      raw_score NUMERIC;
    BEGIN
      CASE lower(difficulty)
        WHEN 'easy' THEN       scale_meters := 25; floor_penalty := 15; max_points := 30;
        WHEN 'medium' THEN     scale_meters := 12; floor_penalty := 25; max_points := 60;
        WHEN 'hard' THEN       scale_meters := 6;  floor_penalty := 40; max_points := 100;
        ELSE                   scale_meters := 12; floor_penalty := 25; max_points := 60;
      END CASE;

      IF guess_floor IS NOT NULL AND truth_floor IS NOT NULL AND guess_floor <> truth_floor THEN
        floor_mismatch_penalty := floor_penalty;
      END IF;

      raw_score := max_points - ROUND(distance_meters / scale_meters) - floor_mismatch_penalty;

      IF raw_score IS NULL OR raw_score < 0 THEN
        RETURN 0;
      ELSIF raw_score > max_points THEN
        RETURN max_points;
      ELSE
        RETURN raw_score::INT;
      END IF;
    END;
    $$;
  `);

    // 4) Backfill scores (all existing assumed 'easy')
    pgm.sql(`
    UPDATE geoguessr_schema.results r
SET score = geoguessr_schema.calc_score(
  r.distance_meters::numeric,
  r.guessed_floor,
  r.actual_floor,
  'easy'::text
);
  `);
};

module.exports.down = (pgm) => {
    pgm.dropConstraint({ schema: 'geoguessr_schema', name: 'results' }, 'difficulty_check');
    pgm.dropColumn({ schema: 'geoguessr_schema', name: 'results' }, 'difficulty');
    pgm.sql(`DROP FUNCTION IF EXISTS geoguessr_schema.calc_score(NUMERIC, INT, INT, TEXT);`);
};