importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
    const { registerRoute } = workbox.routing;
    const { CacheFirst } = workbox.strategies;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;

    registerRoute(
        // ({request}) => request.destination === 'image',
        () => true, // Cache EVERYTHING
        new CacheFirst({
            plugins: [
            new CacheableResponsePlugin({statuses: [0, 200]})
            ],
        })
    );

  } else {
    console.log(`Boo! Workbox didn't load 😬`);
  }
  