import { api } from '$lib/config.js';
import { goto } from '$app/navigation';
import { pageStore } from '$lib/stores';

const taskState = ['open', 'todo', 'doing', 'done', 'close'];

export const load = async ({ parent }) => {
	// console.log('State:', state);
	// const { app } = await parent();

	let app_acronym;
	pageStore.subscribe((value) => {
		app_acronym = value;
	})();

	// console.log(myData);

	// const app_acronym = 'test_acronym';
	// const myData = state?.app || 'Default Data';

	try {
		const requests = [];

		for (let i = 0; i < taskState.length; i++) {
			requests.push(
				api.post('/task/getTasksByState', { state: taskState[i], app_acronym: app_acronym })
			);
		}

		const [open, todo, doing, done, close] = await Promise.all(requests);
		const openTasks = open.data.data;
		const todoTasks = todo.data.data;
		const doingTasks = doing.data.data;
		const doneTasks = done.data.data;
		const closeTasks = close.data.data;

		return { openTasks, todoTasks, doingTasks, doneTasks, closeTasks };
	} catch (error) {
		console.log(error);
	}
};

export const ssr = false;
