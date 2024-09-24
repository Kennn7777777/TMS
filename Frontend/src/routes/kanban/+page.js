import { api } from '$lib/config.js';
import { goto } from '$app/navigation';

export const load = async ({ url, depends }) => {
	try {
		// const requests = [api.get('/users/getAllUsers'), api.get('/group/getAllGroups')];
		// const [usersRes, groupsRes] = await Promise.all(requests);
	} catch (error) {}
};

export const ssr = false;
