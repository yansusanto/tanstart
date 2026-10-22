import { useEffect } from "react";

const KEY = "theme";

// Runs in <head> before first paint so the page never flashes the wrong mode.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

// Press "d" to toggle dark mode. Ignored while typing and with modifier keys.
export function ThemeHotkey() {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() !== "d") return;
			if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
			const el = e.target as HTMLElement | null;
			if (el?.closest('input, textarea, select, [contenteditable="true"]'))
				return;
			const dark = document.documentElement.classList.toggle("dark");
			try {
				localStorage.setItem(KEY, dark ? "dark" : "light");
			} catch {}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return null;
}
