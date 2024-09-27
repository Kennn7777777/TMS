/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#18A0FB'
				}
			},
			screens: {
				'3xl': '1920px'
			}
		}
	},
	plugins: []
};
