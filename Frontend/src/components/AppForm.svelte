<script>
    import { api } from '$lib/config.js';
    import { invalidate, invalidateAll, goto } from '$app/navigation';
    import { toasts } from 'svelte-toasts';

    export let title = "Create App";
//  export let handleSubmit = () => {};
    export let showModal = false;
    export let groups = [];
    let errors = {};
    
    export let acronym = "";
    export let description = "";
    export let rnumber = null;
    export let startDate = "";
    export let endDate = "";
    export let permit_create = "";
    export let permit_open = "";
    export let permit_todolist = "";
    export let permit_doing = "";
    export let permit_done = "";

    export let isEdit = false;


    const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
		}
	};


    const handleSubmit = async () => {
        try {
            const data = { 
                acronym: acronym,
                description: description || null,
                rnumber: rnumber,
                startDate: startDate,
                endDate: endDate,
                permit_create: permit_create || null,
                permit_open: permit_open || null,
                permit_todolist: permit_todolist || null,
                permit_doing: permit_doing || null,
                permit_done: permit_done || null
            }
     
            const response = await api.post("/app/createApp", data);
            
            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;    
                invalidate('app:rootlayout');
                invalidate('app:applist');
            }

        } catch (error) {
            console.log(errors);
            // TODO: handling error
            const message = error.response?.data?.message || 'An unexpected error occurred';

            errors = error.response?.data?.errors || {};
        }
    }

    const handleEditApp = async () => {
        try {
            const data = { 
                app_acronym: acronym,
                description: description || null,
                permit_create: permit_create || null,
                permit_open: permit_open || null,
                permit_todolist: permit_todolist || null,
                permit_doing: permit_doing || null,
                permit_done: permit_done || null
            }

            const response = await api.patch("/app/updateApp", data);
            
            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;    
                invalidate('app:rootlayout');
                invalidate('app:applist');
            }

        } catch (error) {
            console.log(errors);
            // TODO: handling error
            const message = error.response?.data?.message || 'An unexpected error occurred';

            errors = error.response?.data?.errors || {};
        }
    }

</script>

<div class="bg-white rounded-lg shadow-lg px-6 py-10 w-full max-w-4xl">
    <!-- modal title -->
    <h2 class="text-2xl font-semibold mb-4 ml-5">{title}</h2>

    <!-- form -->
    <!-- space-y-4 -->
    <form on:submit|preventDefault={!isEdit?handleSubmit:handleEditApp} class=" max-w-3xl mx-auto mt-5">
        <!-- acronym -->
        <div class="flex items-center justify-center space-x-4">
            <label for="acronym" class="block text-sm font-medium text-gray-700 w-32">Acronym:</label>
            <input
                disabled={isEdit}
                bind:value={acronym}
                on:input={() => {
                    if (errors.hasOwnProperty('acronym')) {
                        delete errors.acronym;
                    }
                }}
                type="text"
                placeholder="Enter acronym..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
        </div>
        <!-- acronym error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.acronym}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.acronym}</div>
            {/if}
        </div>

        <!-- description  -->
        <div class="flex items-start justify-center space-x-4 mb-4">
            <label for="description" class="block text-sm font-medium text-gray-700 w-32">Description:</label>
            <textarea bind:value={description} class="flex-1 resize-none border border-gray-300 rounded-md p-2" id="description" name="description" rows="4" placeholder="Enter your description here..." />
        </div>

        <!-- r number -->
        <div class="flex items-center justify-center space-x-4">
            <label for="rnumber" class="block text-sm font-medium text-gray-700 w-32">R number:</label>
            <input
                disabled={isEdit}
                id="rnumber"
                on:input={() => {
                    if (errors.hasOwnProperty('rnumber')) {
                        delete errors.rnumber;
                    }
                }}
                bind:value={rnumber}
                type="number"
                placeholder="Enter r number..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
        </div>

        <!-- r number error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.rnumber}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.rnumber}</div>
            {/if}
        </div>

        <!-- start/end date -->
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
                <label for="start-date" class="block text-sm font-medium text-gray-700">Start date:</label>
                <input id="start-date" type="date" 
                    disabled={isEdit} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    bind:value={startDate}
                    on:input={() => {
                        if (errors.hasOwnProperty('startDate')) {
                            delete errors.startDate;
                            errors = { ...errors};
                        }
                    }}
                />
            </div>

            <div class="space-y-2">
                <label for="end-date" class="block text-sm font-medium text-gray-700">End date:</label>
                <input id="end-date" type="date"
                    disabled={isEdit} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed" 
                    bind:value={endDate}
                    on:input={() => {
                        if (errors.hasOwnProperty('endDate')) {
                            delete errors.endDate;
                            errors = { ...errors};
                        }
                    }}
                />
            </div>
        </div>

        <!-- start/end date error message -->
        <div class="grid grid-cols-2 gap-4 mb-4">
            {#if errors.startDate || errors.endDate}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.startDate ??= ""}</div>
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.endDate ??= ""}</div>
            {/if}
        </div>

        <!-- permit group -->
        <!-- heading -->
        <h3 class="text-sm font-medium text-gray-700">Permit Group:</h3>
        <div class="space-y-2 flex flex-wrap justify-between mb-4">

            <!-- create -->
            <div class="flex items-center space-x-4">
                <label for="create" class="w-32 text-sm font-medium text-gray-700">create:</label>
                <select bind:value={permit_create} id="create" class="px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select group</option>
                    {#each groups as group}
                        <option value={group.group_name}>{group.group_name}</option>
                    {/each}
                </select>
            </div>

            <!-- open -->
            <div class="flex items-center space-x-4">
                <label for="open" class="w-32 text-sm font-medium text-gray-700">open:</label>
                <select bind:value={permit_open} id="open" class="px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select group</option>
                    {#each groups as group}
                        <option value={group.group_name}>{group.group_name}</option>
                    {/each}
                </select>
            </div>

            <!-- todo list -->
            <div class="flex items-center space-x-4">
                <label for="todolist" class="w-32 text-sm font-medium text-gray-700">todo list:</label>
                <select bind:value={permit_todolist} id="todolist" class="px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select group</option>
                    {#each groups as group}
                        <option value={group.group_name}>{group.group_name}</option>
                    {/each}
                </select>
            </div>

            <!-- doing -->
            <div class="flex items-center space-x-4">
                <label for="doing" class="w-32 text-sm font-medium text-gray-700">doing:</label>
                <select bind:value={permit_doing} id="doing" class="px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select group</option>
                    {#each groups as group}
                        <option value={group.group_name}>{group.group_name}</option>
                    {/each}
                </select>
            </div>

            <!-- done -->
            <div class="flex items-center space-x-4">
                <label for="done" class="w-32 text-sm font-medium text-gray-700">done:</label>
                <select bind:value={permit_done} id="done" class="px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select group</option>
                    {#each groups as group}
                        <option value={group.group_name}>{group.group_name}</option>
                    {/each}
                </select>
            </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end space-x-4">
            <button
                on:click={() => {
                    showModal = false;
                }}
                class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">
                Close
            </button>

            <button type="submit" class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">{title}</button>
        </div>
    </form>
</div>