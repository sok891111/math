module.exports = {
  async headers() {
    const noCache = [
      { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];
    return [
      { source: '/:userId([A-Za-z0-9]{4,10})', headers: noCache },
      { source: '/:userId([A-Za-z0-9]{4,10})/platformer', headers: noCache },
      { source: '/:userId([A-Za-z0-9]{4,10})/island', headers: noCache },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:userId([A-Za-z0-9]{4,10})/platformer',
        destination: '/:userId/platformer',
      },
      {
        source: '/:userId([A-Za-z0-9]{4,10})/platformer/',
        destination: '/:userId/platformer',
      },
      {
        source: '/:userId([A-Za-z0-9]{4,10})/platformer/index.html',
        destination: '/:userId/platformer',
      },
      {
        source: '/:userId([A-Za-z0-9]{4,10})/island',
        destination: '/:userId/island',
      },
      {
        source: '/:userId([A-Za-z0-9]{4,10})/island/',
        destination: '/:userId/island',
      },
      {
        source: '/:userId([A-Za-z0-9]{4,10})/island.html',
        destination: '/:userId/island',
      },
    ];
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/admin/tralalerio': ['./tralalerio/assets/battle-data.json'],
      '/[userId]/platformer': ['./public/platformer/index.html'],
      '/[userId]/island': ['./public/index.html'],
      '/tralalerio': ['./public/tralalerio/index.html'],
      '/[userId]/tralalerio': ['./public/tralalerio/index.html'],
      '/magic-english/test/stage4': ['./public/magic-english/index.html'],
      '/magic-english/test/stage3': ['./public/magic-english/index.html'],
      '/magic-english': ['./public/magic-english/index.html'],
      '/[userId]/magic-english': ['./public/magic-english/index.html'],
      '/hanja': ['./public/hanja/index.html'],
      '/[userId]/hanja': ['./public/hanja/index.html'],
    },
  },
};
