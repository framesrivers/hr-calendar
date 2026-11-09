// Hello Rivers Calendar: push notifications, and the last loaded page when offline.
var CACHE = "hr-cal-1";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);
  var mine = u.origin === self.location.origin || u.href.indexOf("https://www.gstatic.com/firebasejs/") === 0;
  if (!mine) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || Response.error(); });
  }));
});

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Calendar", {
    body: d.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || "/", day: d.day || null }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (wins) {
    for (var i = 0; i < wins.length; i++) {
      if ("focus" in wins[i]) { wins[i].postMessage({ day: data.day }); return wins[i].focus(); }
    }
    return self.clients.openWindow(data.url || "/");
  }));
});
