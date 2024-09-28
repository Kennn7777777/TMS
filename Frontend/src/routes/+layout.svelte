<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { pageStore } from '$lib/stores';
	import { ToastContainer, FlatToast } from 'svelte-toasts';
	import { goto } from '$app/navigation';
	import { api } from '$lib/config.js';

	export let data;

	let title = 'Home';
	let showNavbar = true;
	$: currUser = data.userData;
	$: isAdmin = currUser?.isAdmin;
	// $: isAdmin = currUser?.group_names?.includes('admin');

	$: {
		showNavbar = !($page.url.pathname === '/login');

		switch ($page.url.pathname) {
			case '/app':
				title = 'App List';
				break;
			case "/kanban":
				title = `Kanban (${$pageStore})`;
				break;
			case '/admin':
				title = 'User Management';
				break;
			case '/profile':
				title = 'User Profile';
				break;
			default:
				title = 'Home';
		}
	}
   

	const handleLogout = async () => {
		try {
			const response = await api.get('/auth/logout');

			if (response.data.success) {
				await goto('/login', { noScroll: false, replaceState: true });
			}
		} catch (error) {
			console.log(error);
		}
	};
</script>

<main class="h-full">
	{#if showNavbar}
		<nav class="bg-gray-400 sticky top-0 w-full z-[99]">
			<!-- max-w-[90rem] -->
			<div class="mx-auto lg:max-w-[118rem] max-w-[90rem] px-2">
				<div class="relative flex h-16 items-center justify-between">
					<div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
						<div class="hidden sm:ml-6 sm:block">
							<div class="flex space-x-4">
								<a
									href={$page.url.pathname}
									class=" px-3 py-2 text-lg font-medium text-black cursor-default"
									aria-current="page">{title}</a
								>
							</div>
						</div>
					</div>
					
					<div
						class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
					>
					
						<!-- username -->
						{#if currUser}
							<div class="font-medium">{currUser.username}</div>
						{/if}
						<!-- profile dropdown -->
						<div class="group relative cursor-pointer py-2">
							<div class="relative ml-3">
								<div>
									<button
										type="button"
										class="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
										id="user-menu-button"
										aria-expanded="false"
										aria-haspopup="true"
									>
										<span class="absolute -inset-1.5"></span>
										<span class="sr-only">Open user menu</span>
										<img
											class="h-8 w-8 rounded-full"
											src="https://i.imgur.com/WxNkK7J.png"
											alt=""
										/>
									</button>
								</div>
							</div>

							<!-- Menu -->
							<div
								class="invisible absolute mt-2 right-0 z-[99] flex flex-col bg-gray-100 px-4 py-1 text-gray-800 shadow-xl group-hover:visible"
							>
								<a
									href="/profile"
									class="my-2 block border-b border-gray-100 py-1 font-semibold text-gray-500 hover:text-black md:mx-2"
								>
									View/Edit Profile
								</a>

								<a
								href="/app"
								class="my-2 block border-b border-gray-100 py-1 font-semibold text-gray-500 hover:text-black md:mx-2"
							>
								View Apps
							</a>

								{#if isAdmin}
									<a
										href="/admin"
										class="my-2 block border-b border-gray-100 py-1 font-semibold text-gray-500 hover:text-black md:mx-2"
									>
										User Management
									</a>
								{/if}

								<button
									on:click={handleLogout}
									class="my-2 text-left block border-b border-gray-100 py-1 font-semibold text-gray-500 hover:text-black md:mx-2"
								>
									Logout
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</nav>
	{/if}

	<slot />

	<!-- Toast Notification message -->
	<ToastContainer placement="bottom-left" let:data >
		<FlatToast {data} />
	</ToastContainer>
</main>
