import { api } from '$lib/config.js';

export const load = async ({ depends, parent }) => {
	try {
		await parent();
		depends('app:applist');
		console.log('LOAD ALL APPS');

		const response = await api.get('/app/getAllApps');

		if (response.data.success) {
			const apps = response.data.data;

			return { apps };
		}
	} catch (error) {
		console.log(error);
	}
};

export const ssr = false;
