export async function registerTopperChoiceServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  })
}
