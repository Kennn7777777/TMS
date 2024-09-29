import { api } from '$lib/config.js';

export const load = async ({ depends, parent }) => {
	try {
		const { userData } = await parent();
		depends('app:applist');
		console.log('LOAD ALL APPS');

		const requests = [api.get('/app/getAllApps'), api.get('/group/getAllGroups')];

		const [appsRes, groupsRes] = await Promise.all(requests);
		const apps = appsRes.data.data;
		const groups = groupsRes.data.data;

		console.log(userData);

		return { apps, groups, userData };

		// const response = await api.get('/app/getAllApps');

		// if (response.data.success) {
		// 	const apps = response.data.data;

		// 	return { apps };
		// }
	} catch (error) {
		console.log(error);
	}
};

export const ssr = false;
