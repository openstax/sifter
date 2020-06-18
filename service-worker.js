importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
    const { registerRoute } = workbox.routing;
    const { CacheFirst, StaleWhileRevalidate } = workbox.strategies;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;

    const isPageUrl = (url) => /cnx\.org/.test(url.hostname) && /:/.test(url.pathname)

    // Cache Pages forever because they have a version in them
    registerRoute(
        ({ url }) => isPageUrl(url),
        new CacheFirst({
            plugins: [ new CacheableResponsePlugin({statuses: [0, 200]}) ],
        })
    );

    // Use the cached version but check for updates for JS, HTML, and the book JSON
    registerRoute(
        ({ url }) => !isPageUrl(url),
        new StaleWhileRevalidate({
            plugins: [ new CacheableResponsePlugin({statuses: [0, 200]}) ],
        })
    );

  } else {
    console.log(`Boo! Workbox didn't load 😬`);
  }
  