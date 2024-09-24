<script>
    export let title = "Create Task";
    export let handleSubmit = () => {};
    export let showModal = false;
</script>


<div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
    <!-- modal title -->
    <h2 class="text-2xl font-semibold mb-4 ml-5">{title}</h2>

    <!-- form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-4 max-w-3xl mx-auto mt-5">
        <!-- task name -->
        <div class="flex items-center justify-center space-x-4">
            <label for="name" class="block text-sm font-medium text-gray-700 w-32">Name:</label>
            <input
                id = "name"
                on:input={() => {}}
                type="text"
                placeholder="Enter task name..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>

        <!-- description  -->
        <div class="flex items-start justify-center space-x-4">
            <label for="description" class="block text-sm font-medium text-gray-700 w-32">Description:</label>
            <textarea class="flex-1 border border-gray-300 rounded-md p-2" id="description" name="description" rows="4" placeholder="Enter your description here..." />
        </div>

        <!-- plan -->
        <div class="flex items-center space-x-4">
            <label for="plan" class="w-32 text-sm font-medium text-gray-700">Plan:</label>
            
            <select id="plan" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select plan</option>
                <option>Plan 1</option>
                <option>Plan 2</option>
                <option>Plan 3</option>
            </select>
        </div>

        <!-- notes -->
        <div class="flex items-start justify-center space-x-4">
            <label for="notes" class="block text-sm font-medium text-gray-700 w-32">Notes:</label>
            <textarea id="notes" class="flex-1 border border-gray-300 rounded-md p-2" name="notes" rows="4" placeholder="Enter your notes here..." />
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