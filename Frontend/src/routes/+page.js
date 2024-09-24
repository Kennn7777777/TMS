import { goto } from '$app/navigation';

export const load = async () => {
	// throw redirect(301, '/app');
	goto('/app');
};

export const ssr = false;
