<script>
    import { api } from '$lib/config.js';
    import { invalidate, invalidateAll, goto } from '$app/navigation';
    import { toasts } from 'svelte-toasts';

    export let title = "Create Task";
    export let showModal = false;
    // export let handleSubmit = () => {};

    export let acronym;
    export let username;
    export let plans;

    let task_name = "";
    let description = "";
    let plan = "";
    let notes = "";

    let errors = {};

    $: {
        console.log(plans);
    }

    const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
		}
	};

    // create task
    const handleCreateTask = async () => {
        try {
            const data = {
                app_acronym: acronym,
                name: task_name,
                description: description || null,
                plan: plan || null,
                notes: notes || null,
                creator: username,
                owner: username,
            }

            const response = await api.post("/task/createTask", data);

            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;
                invalidate('app:rootlayout');
                invalidate('app:kanban');
            }

        } catch (error) {
            const message = error.response?.data?.message || 'An unexpected error occurred';

            if (error.response?.data?.code === 'ERR_TASK') {
                showModal = false;
                invalidate('app:rootlayout');
                invalidate('app:kanban');
                await goto('/kanban', { noScroll: false, replaceState: true });
                showToast(false, message);
            } else {
                errors = error.response?.data?.errors || {};
            }
        }
    }
    
</script>


<div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
    <!-- modal title -->
    <h2 class="text-2xl font-semibold mb-4 ml-5">{title}</h2>

    <!-- form -->
    <form on:submit|preventDefault={handleCreateTask} class="max-w-3xl mx-auto mt-5">
        <!-- task name -->
        <div class="flex items-center justify-center space-x-4">
            <label for="task_name" class="block text-sm font-medium text-gray-700 w-32">Name:</label>
            <input
                bind:value={task_name}
                id = "task_name"
                on:input={() => {
                    if (errors.hasOwnProperty('name')) {
                        delete errors.name;
                    }
                }}
                type="text"
                placeholder="Enter task name..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>

        <!-- task name error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.name}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.name}</div>
            {/if}
        </div>

        <!-- description  -->
        <div class="flex items-start justify-center space-x-4 mb-4">
            <label for="description" class="block text-sm font-medium text-gray-700 w-32">Description:</label>
            <textarea bind:value={description} class="flex-1 border border-gray-300 rounded-md p-2 resize-none" id="description" name="description" rows="4" maxlength="255" placeholder="Enter your description here..." />
        </div>

        <!-- plan -->
        <div class="flex items-center space-x-4 mb-4">
            <label for="plan" class="w-32 text-sm font-medium text-gray-700">Plan:</label>
            
            <select bind:value={plan} id="plan" class="px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select plan</option>
                {#each plans as {plan_mvp_name}}
                    <option value={plan_mvp_name}>{plan_mvp_name}</option>
                {/each}
            </select>
        </div>

        <!-- notes -->
        <div class="flex items-start justify-center space-x-4 mb-4">
            <label for="notes" class="block text-sm font-medium text-gray-700 w-32">Notes:</label>
            <textarea bind:value={notes} id="notes" class="flex-1 border border-gray-300 rounded-md p-2 resize-none" name="notes" rows="6" placeholder="Enter your notes here..." />
        </div>

        <!-- buttons -->
        <div class="flex justify-end space-x-4">
            <button
                on:click={() => {
                    showModal = false;
                }}
                class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">
                Close
            </button>

            <button type="submit" class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">Create Task</button>
        </div>
    </form>
</div>