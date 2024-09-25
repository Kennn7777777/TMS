<script>
    import { api } from '$lib/config.js';
    import { invalidate, invalidateAll, goto } from '$app/navigation';
    import { toasts } from 'svelte-toasts';

    export let title = "Create Plan";
    // export let handleSubmit = () => {};
    export let showModal = false;
    export let isEdit = false;

    export let app_acronym = "";
    export let name = "";
    export let startDate = "";
    export let endDate = "";
    export let colour = "#000000";

    let errors = {};

    $: {
        // console.log(name);
        // console.log(startDate);
        // console.log(endDate);
        // console.log(colour);
    }

    const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
		}
	};

    const handleCreatePlan = async () => {
        try {
            const data = {
                mvp_name: name,
                startDate: startDate,
                endDate: endDate,
                app_acronym: app_acronym,
                colour: colour.slice(1,colour.length)
            }

            const response = await api.post("/plan/createPlan", data);

            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;    
                invalidate('app:rootlayout');
                invalidate('app:kanban');
            }
            
        } catch (error) {
            console.log(errors);
            // TODO: handling error
            const message = error.response?.data?.message || 'An unexpected error occurred';

            errors = error.response?.data?.errors || {};
        }
    }

    const handleEditPlan = async () => {
        try {
            const data = {
                mvp_name: name,
                app_acronym: app_acronym,
                startDate: startDate,
                endDate: endDate,
                colour: colour.slice(1,colour.length)
            }

            const response = await api.patch("/plan/updatePlan", data);
            
            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;    
                invalidate('app:rootlayout');
                invalidate('app:kanban');
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
    <form on:submit|preventDefault={!isEdit?handleCreatePlan:handleEditPlan} class="max-w-3xl mx-auto mt-5">
        <!-- plan name -->
        <div class="flex items-center justify-center space-x-4">
            <label for="name" class="block text-sm font-medium text-gray-700 w-32">Name:</label>
            <input
                id="name"
                disabled={isEdit} 
                bind:value={name}
                on:input={() => {
                    if (errors.hasOwnProperty('mvp_name')) {
                        delete errors.mvp_name;
                    }
                }}
                type="text"
                placeholder="Enter plan name..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
        </div>

        <!-- plan name error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.mvp_name}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.mvp_name}</div>
            {/if}
        </div>

        <!-- start date -->
        <div class="flex items-center justify-center space-x-4">
            <label for="start-date" class="block text-sm font-medium text-gray-700 w-32">Start date:</label>
            
            <input id="start-date" type="date" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                bind:value={startDate}
                on:input={() => {
                    if (errors.hasOwnProperty('startDate')) {
                        delete errors.startDate;
                        errors = { ...errors};
                    }
                }} />
        </div>

        <!-- start date error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.startDate}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.startDate}</div>
            {/if}
        </div>

        <!-- end date -->
        <div class="flex items-center justify-center space-x-4">
            <label for="end-date" class="block text-sm font-medium text-gray-700 w-32">End date:</label>
            
            <input id="end-date" type="date"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                bind:value={endDate}
                on:input={() => {
                    if (errors.hasOwnProperty('endDate')) {
                        delete errors.endDate;
                        errors = { ...errors};
                    }
                }} />
        </div>

        <!-- end date error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.endDate}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.endDate}</div>
            {/if}
        </div>

        <!-- colour -->
        <div class="flex items-center justify-start space-x-4">
            <label for="colour" class="block text-sm font-medium text-gray-700 w-32">Colour:</label>
            
            <input 
                type="color" id="colour" name="colour" 
                bind:value={colour} 
                class="border border-gray-300 rounded-md">       
        </div>

        <!-- colour error message -->
        <div class="flex space-x-4 mb-4">
            <div class="w-32" />
            {#if errors.colour}
                <div class="text-sm text-red-500 whitespace-normal break-words">{errors.colour}</div>
            {/if}
        </div>

        <!-- Buttons -->
        <div class="flex justify-end space-x-4 pt-4">
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