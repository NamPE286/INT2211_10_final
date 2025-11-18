import { browser } from '$app/environment';

function createThemeStore() {
	let theme = $state<'light' | 'dark'>(
		browser
			? (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
			: 'light'
	);

	return {
		get value() {
			return theme;
		},
		toggle() {
			theme = theme === 'light' ? 'dark' : 'light';
			if (browser) {
				localStorage.setItem('theme', theme);
				if (theme === 'dark') {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
		},
		set(value: 'light' | 'dark') {
			theme = value;
			if (browser) {
				localStorage.setItem('theme', value);
				if (value === 'dark') {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
		},
		init() {
			if (browser) {
				const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
				if (stored) {
					theme = stored;
					if (stored === 'dark') {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
				}
			}
		}
	};
}

export const themeStore = createThemeStore();
