importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
    const { registerRoute } = workbox.routing;
    const { CacheFirst, StaleWhileRevalidate } = workbox.strategies;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;

    registerRoute(
        ({ url }) => {
            return /cnx\.org/.test(url.hostname) && /:/.test(url.pathname) // Cache Pages because they have a version in them
        },
        new CacheFirst({
            plugins: [
            new CacheableResponsePlugin({statuses: [0, 200]})
            ],
        })
    );

    registerRoute(
        ({ url }) => {
            return !/cnx\.org/.test(url.hostname) // Pull updates for the HTML, JS code that is hosted
        },
        new StaleWhileRevalidate({
            plugins: [
            new CacheableResponsePlugin({statuses: [0, 200]})
            ],
        })
    );

  } else {
    console.log(`Boo! Workbox didn't load 😬`);
  }
  