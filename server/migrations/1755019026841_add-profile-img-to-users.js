module.exports.shorthands = undefined;

module.exports.up = (pgm) => {
    pgm.addColumn({ schema: 'geoguessr_schema', name: 'users' }, {
    profile_image: { type: 'text', notNull: true, default: '/assets/avatars/avatar1.jpg' }
  });
};

module.exports.down = (pgm) => {
    pgm.dropColumn({ schema: 'geoguessr_schema', name: 'users' }, 'profile_image');
};
