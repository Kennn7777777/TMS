import { api } from '$lib/config.js';
import { error } from '@sveltejs/kit';

export const load = async ({ depends, parent }) => {
	const { userData } = await parent();
	depends('app:applist');

	const requests = [api.get('/app/getAllApps'), api.get('/group/getAllGroups')];

	const [appsRes, groupsRes] = await Promise.all(requests);
	const apps = appsRes.data.data;
	const groups = groupsRes.data.data;

	if (!apps && !groups) {
		error(404, {
			message: 'An error has occured'
		});
	}
	
	return { apps, groups, userData };

};

export const ssr = false;
