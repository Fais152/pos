export function printSection(elementId: string) {
  if (typeof window === "undefined") return;
  const target = document.getElementById(elementId);
  if (!target) return;
  document.body.classList.add("printing");
  const cleanup = () => {
    document.body.classList.remove("printing");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.setTimeout(() => {
    window.print();
    window.setTimeout(cleanup, 1000);
  }, 50);
}
