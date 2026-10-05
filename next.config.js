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
      '/[userId]/platformer': ['./public/platformer/index.html'],
      '/[userId]/island': ['./public/index.html'],
    },
  },
};
