export const THEME_STORAGE_KEY = "koetaw-theme";

export const THEME_COLORS = {
  light: "#faf7f2",
  dark: "#171110",
} as const;

export const THEME_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";var m=document.getElementById("koetaw-theme-color");if(m)m.setAttribute("content",d?"${THEME_COLORS.dark}":"${THEME_COLORS.light}");}catch(e){}})();`;
