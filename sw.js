const CACHE_NAME = 'vocabforge-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Cài đặt Service Worker và lưu bộ nhớ đệm (Cache)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Chặn các yêu cầu mạng để ưu tiên tải trang nhanh
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Nếu tìm thấy trong cache thì trả về ngay (chạy mượt)
        if (response) {
          return response;
        }
        // Nếu không có thì tải từ mạng (như lấy dữ liệu Google Sheets)
        return fetch(event.request);
      })
  );
});
