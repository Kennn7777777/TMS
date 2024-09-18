import { api } from '$lib/config.js';
import { goto } from '$app/navigation';
import { toasts } from 'svelte-toasts';

const showToast = (success, messageDesc) => {
	if (success) {
		toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
	} else {
		toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
	}
};

const logOut = async () => {
	try {
		const response = await api.get('/auth/logout');

		if (response.data.success) {
			await goto('/login', { noScroll: false, replaceState: true });
		}
	} catch (error) {
		console.log(error);
	}
};

export const load = async ({ url, depends }) => {
	depends('app:rootlayout');

	if (!(url.pathname === '/login')) {
		try {
			const response = await api.get('/users/getUser');

			if (response.data.success) {
				const userGroups = response.data.data.group_names?.split(', ');

				if (url.pathname === '/admin' && !userGroups.includes('admin')) {
					await goto('/');
				}
				return { userData: { ...response.data.data, group_names: userGroups } };
			}
		} catch (error) {
			if (error.response.data.code === 'ERR_AUTH') {
				await logOut();
				showToast(false, error.response.data.message);
			} else {
				showToast(false, error.response.data.message);
			}
		}
	}

	return {};
};

export const ssr = false;
