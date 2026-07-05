/* RogueAge — minimal service worker (install prompt only; network-first). */
(function () {
    'use strict';

    var CACHE_VERSION = 'rogeage-pwa-v1';

    self.addEventListener('install', function (event) {
        self.skipWaiting();
        event.waitUntil(Promise.resolve());
    });

    self.addEventListener('activate', function (event) {
        event.waitUntil(
            caches.keys().then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (key) { return key.indexOf('rogeage-pwa-') === 0 && key !== CACHE_VERSION; })
                        .map(function (key) { return caches.delete(key); })
                );
            }).then(function () { return self.clients.claim(); })
        );
    });

    /* Always fetch live assets — avoids stale JS/HTML after deploy. */
    self.addEventListener('fetch', function (event) {
        if (event.request.method !== 'GET') return;
        event.respondWith(fetch(event.request));
    });
})();
