import { api } from '$lib/config.js';
import { goto } from '$app/navigation';
import { pageStore } from '$lib/stores';

const taskState = ['open', 'todoList', 'doing', 'done', 'close'];

export const load = async ({ parent, depends }) => {
	try {
		const { userData } = await parent();
		depends('app:kanban');

		let app_acronym;

		pageStore.subscribe((value) => {
			app_acronym = value;
		})();

		// redirect user back to app list page (if refresh)
		if (!app_acronym) {
			goto('/app', { replaceState: true });
		}

		const requests = [];

		for (let i = 0; i < taskState.length; i++) {
			requests.push(
				api.post('/task/getTasksByState', { state: taskState[i], app_acronym: app_acronym })
			);
		}

		requests.push(api.post('/plan/getAllPlans', { app_acronym: app_acronym }));

		const [open, todo, doing, done, close, planReq] = await Promise.all(requests);
		const openTasks = open.data.data;
		const todoTasks = todo.data.data;
		const doingTasks = doing.data.data;
		const doneTasks = done.data.data;
		const closeTasks = close.data.data;
		const plans = planReq.data.data;

		// console.log('plans: ' + plans);

		return {
			openTasks,
			todoTasks,
			doingTasks,
			doneTasks,
			closeTasks,
			app_acronym,
			plans,
			username: userData.username
		};
	} catch (error) {
		console.log(error);
	}
};

export const ssr = false;
