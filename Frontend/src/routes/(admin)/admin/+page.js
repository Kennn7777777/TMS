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

export const load = async ({ depends, parent }) => {
	try {
		const { userData } = await parent();
		depends('app:admin');

		// if (userData.group_names.includes('admin')) {
		if (userData.isAdmin) {
			const requests = [api.get('/users/getAllUsers'), api.get('/group/getAllGroups')];

			const [usersRes, groupsRes] = await Promise.all(requests);
			const users = usersRes.data.data;
			const groups = groupsRes.data.data;

			return { users, groups };
		}
	} catch (error) {
		if (error.response.data.code === 'ERR_AUTH') {
			await logOut();
			showToast(false, error.response.data.message);
		} else {
			showToast(false, error.response.data.message);
		}
	}

	return {};
};

export const ssr = false;
