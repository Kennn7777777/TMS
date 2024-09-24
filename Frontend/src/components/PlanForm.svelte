<script>
    export let title = "Create Plan";
    export let handleSubmit = () => {};
    export let showModal = false;
</script>


<div class="bg-white rounded-lg shadow-lg px-6 py-10 w-full max-w-4xl">
    <!-- modal title -->
    <h2 class="text-2xl font-semibold mb-4 ml-5">{title}</h2>

    <!-- form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-4 max-w-3xl mx-auto mt-5">
        <!-- plan name -->
        <div class="flex items-center justify-center space-x-4">
            <label for="name" class="block text-sm font-medium text-gray-700 w-32">Name:</label>
            <input
                id = "name"
                on:input={() => {}}
                type="text"
                placeholder="Enter plan name..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>

        <!-- start date -->
        <div class="flex items-center justify-center space-x-4">
            <label for="start-date" class="block text-sm font-medium text-gray-700 w-32">Start date:</label>
            
            <input id="start-date" type="date" class="flex-1 px-3 py-2 border border-gray-300 rounded-md"  />
        </div>

        <!-- end date -->
        <div class="flex items-center justify-center space-x-4">
            <label for="end-date" class="block text-sm font-medium text-gray-700 w-32">End date:</label>
            
            <input id="end-date" type="date" class="flex-1 px-3 py-2 border border-gray-300 rounded-md"  />
        </div>

        <!-- colour -->
        <div class="flex items-center justify-start space-x-4">
            <label for="colour" class="block text-sm font-medium text-gray-700 w-32">Colour:</label>
            
            <input type="color" id="colour" name="colour" value="#ff0000" class="border border-gray-300 rounded-md">       
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