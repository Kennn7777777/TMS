import { api } from '$lib/config.js';

export const load = async () => {
	try {
		const response = await api.get('/app/getAllApps');

		if (response.data.success) {
			const apps = response.data.data;
			console.log(apps);
			return { apps };
		}
	} catch (error) {
		console.log(error);
	}
};

export const ssr = false;
