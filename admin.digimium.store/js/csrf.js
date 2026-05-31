"use strict";

(() => {
  const getMeta = () =>
    document.querySelector('meta[name="csrf-token"]')?.content ?? "";

  window.csrfFetch = function (resource, init = {}) {
    const method = (init.method || "GET").toUpperCase();
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(method)) {
      return fetch(resource, init);
    }
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", getMeta());
    }
    return fetch(resource, { ...init, headers });
  };
})();
