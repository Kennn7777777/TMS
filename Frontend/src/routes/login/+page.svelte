<script>
	import { api } from '$lib/config.js';
	import { goto } from '$app/navigation';
	import { toasts } from 'svelte-toasts';

	let username = '';
	let password = '';

	const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
		}
	};

	const handleLogin = async () => {
		try {
			const data = { username, password };
			const response = await api.post('/auth/login', data);

			if (response.data.success) {
				await goto('/', { replaceState: true });
			}
		} catch (error) {
			if (!error.response.data.success) {
				showToast(false, error.response.data.message);
			}
		}
	};
</script>

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<form on:submit|preventDefault={handleLogin} class="space-y-6">
			<div>
				<label for="username" class="block text-sm font-medium leading-6 text-gray-900"
					>Username</label
				>
				<div class="mt-2">
					<input
						id="username"
						name="username"
						placeholder="Username"
						bind:value={username}
						required
						class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium leading-6 text-gray-900"
					>Password</label
				>
				<div class="mt-2">
					<input
						id="password"
						name="password"
						type="password"
						placeholder="Password"
						bind:value={password}
						autocomplete="current-password"
						required
						class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					class="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					>Login</button
				>
			</div>
		</form>
	</div>
</div>

<style lang="postcss">
	/* :global(html) {
		background-color: theme(colors.gray.100);
	} */

	.root {
		@apply flex min-h-full flex-col justify-center px-6 py-12 bg-gray-100;
	}

	/*
	.container {
		@apply bg-green-400 mx-auto w-full max-w-sm;
	}*/
</style>
