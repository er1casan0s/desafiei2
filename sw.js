// ============================================================
// 🌍 SERVICE WORKER — Offline + Notificações
// ============================================================
const CACHE_NAME = "desafiei-v4";

const ARQUIVOS = [
    "/",
    "/dashboard",
    "/static/css/style.css",
    "/static/js/app.js",
    "/static/js/tema.js",
    "/static/js/coruja.js",
    "/static/img/coruja.png",
];

// Instala
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS))
    );
    self.skipWaiting();
});

// Ativa
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(chaves =>
            Promise.all(
                chaves
                    .filter(c => c !== CACHE_NAME)
                    .map(c => caches.delete(c))
            )
        )
    );
    self.clients.claim();
});

// Fetch (offline)
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request)
                .then(resp => {
                    if (resp && resp.status === 200) {
                        const clone = resp.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return resp;
                })
                .catch(() => cached);
            return cached || fetchPromise;
        })
    );
});

// 🔔 Suporte a notificações push
self.addEventListener("push", event => {
    const dados = event.data ? event.data.json() : {};
    const titulo = dados.titulo || "🦉 Desafiei";
    const opcoes = {
        body: dados.corpo || "Hora de treinar seu cérebro!",
        icon: "/static/img/coruja-192.png",
        badge: "/static/img/coruja-192.png",
        vibrate: [200, 100, 200],
    };
    event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// Clique na notificação → abre o dashboard
self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(lista => {
            for (const c of lista) {
                if (c.url.includes("/dashboard") && "focus" in c) return c.focus();
            }
            if (clients.openWindow) return clients.openWindow("/dashboard");
        })
    );
});