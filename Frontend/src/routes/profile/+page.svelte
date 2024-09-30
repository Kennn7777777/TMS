<script>
	import { api } from '$lib/config.js';
	import { toasts } from 'svelte-toasts';
	import { onMount } from 'svelte';
	import { invalidate, goto } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	export let data;

	$: userData = data.userData;
	$: username = userData.username;

	let email = '';
	let password = '';
	let errors = {};

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

	const handleEmail = async () => {
		try {
			const data = { username, email };
			const response = await api.patch('/users/updateEmail', data);

			if (response.data.success) {
				showToast(true, response.data.message);
				invalidate('app:rootlayout');
			}
		} catch (error) {
			const message = error.response?.data?.message || 'An unexpected error occurred';

			// TODO: handle error message
			if (error.response?.data?.code === 'ERR_AUTH') {
				await logOut();
				showToast(false, message);
			} else {
				errors = error.response?.data?.errors || {};
				showToast(false, message);
			}
		}
	};

	const handlePassword = async () => {
		try {
			const data = { username, password };
			const response = await api.patch('/users/updatePassword', data);

			if (response.data.success) {
				showToast(true, response.data.message);
				invalidate('app:rootlayout');
				password = '';
			}
		} catch (error) {
			const message = error.response?.data?.message || 'An unexpected error occurred';

			if (error.response?.data?.code === 'ERR_AUTH') {
				await logOut();
				showToast(false, message);
			} else {
				errors = error.response?.data?.errors || {};
				showToast(false, message);
			}
		}
	};

	onMount(() => {
		email = userData.email;
	});
</script>

<div class="w-full relative">
	<div class="mx-auto max-w-[90rem]">
		<div class="max-w-4xl mx-auto p-6">
			<!-- User Details -->
			<div class="mb-6">
				<h2 class="text-xl font-semibold mb-2">User details</h2>
				<p><span class="font-semibold">Username:</span> {userData.username}</p>
				<p><span class="font-semibold">Email:</span> {userData.email || '-'}</p>
			</div>

			<!-- Update Email Section -->
			<div class="mb-6">
				<h3 class="text-lg font-medium mb-2">Update Email</h3>
				<div class="flex items-center mb-4 justify-center">
					<div class="mr-5 w-32">New Email</div>
					
					<input
						bind:value={email}
						on:input={ () => {
							if (errors.hasOwnProperty('email')) {
								delete errors.email;
							}
						}}
						type="email"
						placeholder="Enter new Email..."
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
					/>
				</div>
				<div class="flex justify-end">
					<div class="mr-5 w-32 invisible"></div>
					{#if errors.email}
						<div class="text-sm flex-1 text-red-500">{errors.email}</div>
					{/if}
					<button
						on:click={handleEmail}
						class="px-4 py-2 text-sm font-semibold leading-6 bg-primary text-white rounded-md hover:bg-blue-600"
						>Update email</button
					>
				</div>
			</div>

			<!-- Change Password Section -->
			<div>
				<h3 class="text-lg font-medium mb-2">Change password</h3>

				<div class="flex items-center mb-4">
					<div class="mr-5 w-32">New Password</div>
					
					<input
						bind:value={password}
						on:input={() => {
							errors = {};
						}}
						type="password"
						placeholder="Enter new Password..."
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
					/>
				</div>

				<div class="flex justify-end items-center">
					<div class="mr-5 w-32 invisible"></div>
					{#if errors.password}
						<div class="text-sm flex-1 text-red-500">{errors.password}</div>
					{/if}
					<button
						on:click={handlePassword}
						class=" px-4 py-2 text-sm font-semibold leading-6 bg-primary text-white rounded-md hover:bg-blue-600"
						>Change password</button
					>
				</div>
			</div>
		</div>
	</div>
</div>
