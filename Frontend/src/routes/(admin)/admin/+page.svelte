<script>
	import { api } from '$lib/config.js';
	import { toasts } from 'svelte-toasts';
	import { invalidate, invalidateAll, goto } from '$app/navigation';

	import MultiSelectDropdown from '$components/MultiSelectDropdown.svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	// entire user list
	$: users = data.users;
	// entire group list
	$: groups = data.groups;

	// single user
	let editingUser = null;
	let password = '';
	let email = null;
	let active = '';
	let selectedGroups = [];
	let userErrors = {};

	// creating groups
	let showGroupModal = false;
	let groupName = '';

	// creating user
	let newUsername = '';
	let newPassword = '';
	let newEmail = null;
	let newActive = 'Yes';
	let newSelectedGroups = [];
	let newIsOpen = false;
	let errors = {};

	const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 4000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 4000, theme: 'light' });
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

	const handleStartEdit = (user) => {
		errors = {};
		userErrors = {};
		editingUser = user;

		// password = user.password;
		email = user.email;
		active = user.active === 1 ? 'Yes' : 'No';
		selectedGroups = user.group_ids?.split(', ').map(Number);
		// console.log(selectedGroups);
	};

	const handleSaveEdit = async (user) => {
		try {
			const data = {
				username: user.username,
				password: password,
				email: email,
				active: active === 'Yes' ? '1' : '0',
				groups: selectedGroups.join(', ')
			};

			const response = await api.patch('/users/updateAll', data);

			if (response.data.success) {
				showToast(true, response.data.message);
				resetEditField();

				invalidate('app:rootlayout');
				invalidate('app:admin');
			}
		} catch (error) {
			if (error.response.data.code === 'ERR_AUTH' || error.response.data.code === 'ERR_ADMIN') {
				await logOut();
				showToast(false, error.response.data.message);
			} else {
				userErrors = error.response.data.errors;

				showToast(false, `Unable to edit User! ` + userErrors.password);
			}
		}
	};

	const handleCancelEdit = () => {
		resetEditField();
	};

	const resetEditField = async () => {
		editingUser = null;
		password = '';
		email = null;
		active = '';
		selectedGroups = [];
	};

	const handleCreateGroup = async () => {
		try {
			const data = { groupName };
			const response = await api.post('/group/createGroup', data);

			if (response.data.success) {
				showGroupModal = false;
				showToast(true, response.data.message);
				groupName = '';
				errors = {};
				invalidate('app:admin');
			}
		} catch (error) {
			if (error.response.data.code === 'ERR_ADMIN' || error.response.data.code === 'ERR_AUTH') {
				showGroupModal = false;
				await logOut();
				showToast(false, error.response.data.message);
			} else {
				errors = error.response.data.errors;
				showToast(false, 'Unable to create Group!');
			}
		}
	};

	const handleCreateUser = async () => {
		try {
			const data = {
				username: newUsername,
				password: newPassword,
				email: newEmail,
				active: newActive === 'Yes' ? '1' : '0',
				groups: newSelectedGroups.join(', ')
			};

			const response = await api.post('/users/createUser', data);

			if (response.data.success) {
				showToast(true, response.data.message);
				resetNewUserField();
				invalidate('app:admin');
			} else {
			}
		} catch (error) {
			if (error.response.data.code === 'ERR_ADMIN' || error.response.data.code === 'ERR_AUTH') {
				showGroupModal = false;
				await logOut();
				showToast(false, error.response.data.message);
			} else {
				errors = error.response.data.errors;
				showToast(false, 'Unable to create User!');
			}
		}
	};

	const resetNewUserField = () => {
		newUsername = '';
		newPassword = '';
		newEmail = null;
		newActive = 'Yes';
		newSelectedGroups = [];
		newIsOpen = false;
		errors = {};
	};
</script>

<div class="w-full relative">
	<div class="mx-auto max-w-[90rem]">
		<div class="flex flex-col mt-10">
			<div class="flex justify-end">
				<div class="ml-14">
					<button
						on:click={() => {
							showGroupModal = true;
						}}
						class="inline-flex self-end px-4 py-2 my-4 text-base font-semibold text-white bg-primary rounded-lg shadow-md"
					>
						Create New Group
					</button>
				</div>
			</div>

			<!-- User table -->
			<div class="max-h-[400px] overflow-y-auto custom-scrollbar">
				<table class="min-w-[90rem] divide-y divide-gray-200">
					<thead class="bg-gray-50 sticky z-1 top-0">
						<tr>
							<th
								scope="col"
								class="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Username
							</th>
							<th
								scope="col"
								class="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Password
							</th>
							<th
								scope="col"
								class="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Email
							</th>
							<th
								scope="col"
								class="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Active
							</th>
							<th
								scope="col"
								class="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Group
							</th>
							<th
								scope="col"
								class="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each users as user (user.username)}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">{user.username}</div>
								</td>
								<td class="px-6 py-4 relative">
									{#if editingUser === user}
										<input
											id="password"
											name="password"
											bind:value={password}
											placeholder="Enter new password..."
											class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
										/>
										<!-- {#if userErrors.password}
										<div
											class="absolute bottom-[-1] text-sm text-red-500 whitespace-normal break-words"
										>
											{userErrors.password}
										</div>
									{/if} -->
									{:else}
										<div class="text-sm text-gray-900">••••••••••</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{#if editingUser === user}
										<input
											id="email"
											name="email"
											bind:value={email}
											placeholder="Enter new email..."
											class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
										/>
									{:else}
										{user.email || '-'}
									{/if}
								</td>

								<td class="px-6 py-4 whitespace-nowrap">
									{#if editingUser === user}
										<select
											bind:value={active}
											class="block w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
											name="active"
										>
											<option value="Yes">Yes</option>
											<option value="No">No</option>
										</select>
									{:else}
										<span
											class="px-4 inline-flex text-xs leading-5 font-semibold rounded-full {user.active ===
											1
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'}"
										>
											{user.active === 1 ? 'Yes' : 'No'}
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{#if editingUser === user}
										<MultiSelectDropdown
											label="Select Groups"
											items={groups}
											bind:selectedItems={selectedGroups}
										/>
									{:else}
										{user.group_names || '-'}
									{/if}
								</td>

								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									{#if editingUser === user}
										<button on:click={handleCancelEdit}>Cancel</button>
										<button
											class="ml-2 text-red-600 hover:text-red-900"
											on:click={() => handleSaveEdit(user)}>Save</button
										>
									{:else}
										<button
											class="text-indigo-600 hover:text-indigo-900"
											on:click={() => handleStartEdit(user)}>Edit</button
										>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Create new User -->

			<table class="min-w-[90rem]">
				<thead>
					<tr>
						<th scope="col" class="w-2/12 px-6"> </th>
						<th scope="col" class="w-2/12 px-6"> </th>
						<th scope="col" class="w-2/12 px-6"> </th>
						<th scope="col" class="w-1/12 px-6"> </th>
						<th scope="col" class="w-3/12 px-6"> </th>
						<th scope="col" class="w-2/12 px-6"> </th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y">
					<tr>
						<td class="px-6 py-4 whitespace-nowrap relative">
							<input
								on:input={() => {
									errors = {};
								}}
								bind:value={newUsername}
								name="NewUsername"
								placeholder="Enter new username..."
								class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
							/>
							{#if errors.username}
								<div class="absolute bottom-[-1] text-sm text-red-500">
									{errors.username}
								</div>
							{/if}
						</td>
						<td class="px-6 py-4 relative">
							<input
								bind:value={newPassword}
								on:input={() => {
									errors = {};
								}}
								name="NewPassword"
								type="password"
								placeholder="Enter new password..."
								class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
							/>
							{#if errors.password}
								<div
									class="absolute bottom-[-1] text-sm text-red-500 whitespace-normal break-words"
								>
									{errors.password}
								</div>
							{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<input
								bind:value={newEmail}
								name="newEmail"
								placeholder="Enter new email..."
								class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
							/>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<select
								bind:value={newActive}
								class="block w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								name="active"
							>
								<option value="Yes">Yes</option>
								<option value="No">No</option>
							</select>
						</td>
						<td class="px-6 py-4">
							<MultiSelectDropdown
								label="Select Groups"
								items={groups}
								bind:isOpen={newIsOpen}
								bind:selectedItems={newSelectedGroups}
							/>
						</td>
						<td class="px-2 py-4 whitespace-nowrap flex justify-end">
							<button
								on:click={handleCreateUser}
								class="px-4 py-2 text-base font-semibold text-white bg-primary rounded-lg shadow-md"
							>
								Create User
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	{#if showGroupModal}
		<div
			class="fixed inset-0 z-[99] w-full h-screen overflow-y-auto flex items-center justify-center"
		>
			<div class="absolute inset-0 w-full h-full bg-gray-500 opacity-75 -z-[99]"></div>

			<div class="flex max-w-md rounded-lg border bg-white">
				<div class="bg-blue flex flex-col rounded-lg p-5 shadow">
					<div class="ml-3">
						<h2 class="font-semibold text-gray-800 text-2xl mb-4">Create Group</h2>

						<div class="mt-2 w-96">
							<label for="group" class="block text-sm font-medium leading-6 text-gray-900"
								>Group name</label
							>

							<div class="mt-1">
								<input
									id="group"
									name="group"
									placeholder="Enter group name"
									bind:value={groupName}
									on:input={() => {
										errors = {};
									}}
									required
									class="block w-full px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
								/>
								{#if errors.group}
									<div class="inline-flex text-sm mt-2 text-red-500">{errors.group}</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="mt-8 flex items-center justify-end">
						<button
							on:click={() => {
								showGroupModal = false;
								groupName = '';
								errors = {};
							}}
							class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
							>Close</button
						>

						<button
							on:click={handleCreateGroup}
							class="ml-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
							>Create Group</button
						>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgb(143, 143, 143);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: #f1f1f1;
	}
</style>
