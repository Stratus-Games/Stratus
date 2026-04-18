const stockSW = "/sw.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];

export async function registerSW() {
  if (!navigator.serviceWorker) {
    if (location.protocol !== "https:" && !swAllowedHostnames.includes(location.hostname)) {
      throw new Error("Service workers cannot be registered without https.");
    }
    throw new Error("Your browser does not support service workers.");
  }

  await navigator.serviceWorker.register(stockSW, { updateViaCache: "none" });
  await navigator.serviceWorker.ready;

  if (!navigator.serviceWorker.controller) {
    await new Promise((resolve) => {
      const onChange = () => {
        navigator.serviceWorker.removeEventListener("controllerchange", onChange);
        resolve();
      };

      navigator.serviceWorker.addEventListener("controllerchange", onChange, { once: true });

      setTimeout(() => {
        navigator.serviceWorker.removeEventListener("controllerchange", onChange);
        resolve();
      }, 3000);
    });
  }
}
