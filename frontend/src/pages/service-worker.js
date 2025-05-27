// ✅ FILE: /public/service-worker.js

const CACHE_NAME = "teralynk-cache-v1"; // Update cache version as needed
const API_BASE_URL = "/api/"; // Replace with your API base path
const STATIC_ASSETS = ["/index.html", "/styles/main.css", "/scripts/main.js"]; // List your static assets

// ✅ Install Event: Caches static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Caching static assets...");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate the worker immediately
});

// ✅ Activate Event: Cleans up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cache) => cache !== CACHE_NAME)
          .map((cache) => caches.delete(cache))
      );
    })
  );
  self.clients.claim(); // Control all clients immediately
});

// ✅ Fetch Event: Handle API caching and token revalidation
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.url.includes(API_BASE_URL)) {
    // Handle API requests with token validation
    event.respondWith(
      fetchWithRevalidation(request).catch(() =>
        caches.match(request).then((cachedResponse) => {
          return cachedResponse || Promise.reject("No cached response");
        })
      )
    );
  } else {
    // Handle non-API requests
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((networkResponse) => {
            if (request.method === "GET") {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
            }
            return networkResponse;
          })
        );
      })
    );
  }
});

// ✅ Fetch helper with token revalidation
async function fetchWithRevalidation(request) {
  const token = await getTokenFromStorage(); // Function to get token securely
  const modifiedHeaders = new Headers(request.headers);

  if (token) {
    modifiedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const modifiedRequest = new Request(request, { headers: modifiedHeaders });
  const response = await fetch(modifiedRequest);

  if (!response.ok) {
    throw new Error("Failed API request");
  }

  // Cache the API response if it's GET
  if (request.method === "GET") {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

// ✅ Helper: Get token securely (mock implementation, replace with your logic)
async function getTokenFromStorage() {
  return await new Promise((resolve) => {
    const token = localStorage.getItem("token");
    resolve(token);
  });
}
