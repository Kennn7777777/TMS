<script>
     export let title = "Create App";
     export let handleSubmit = () => {};
     export let showModal = false;
</script>

<div class="bg-white rounded-lg shadow-lg px-6 py-10 w-full max-w-4xl">
    <!-- modal title -->
    <h2 class="text-2xl font-semibold mb-4 ml-5">{title}</h2>

    <!-- form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-4 max-w-3xl mx-auto mt-5">
        <!-- acronym -->
        <div class="flex items-center justify-center space-x-4">
            <label for="acronym" class="block text-sm font-medium text-gray-700 w-32">Acronym:</label>
            <input
                on:input={() => {}}
                type="text"
                placeholder="Enter acronym..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>

        <!-- description  -->
        <div class="flex items-center justify-center space-x-4">
            <label for="description" class="block text-sm font-medium text-gray-700 w-32">Description:</label>
            <textarea class="flex-1 border border-gray-300 rounded-md p-2" id="description" name="description" rows="4" placeholder="Enter your description here..." />
        </div>

        <!-- r number -->
        <div class="flex items-center justify-center space-x-4">
            <label for="rnumber" class="block text-sm font-medium text-gray-700 w-32">R number:</label>
            <input
                id="rnumber"
                on:input={() => {}}
                type="number"
                placeholder="Enter r number..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>

        <!-- start/end date -->
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
                <label for="start-date" class="block text-sm font-medium text-gray-700">Start date:</label>
                <input id="start-date" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md"  />
            </div>

            <div class="space-y-2">
                <label for="end-date" class="block text-sm font-medium text-gray-700">End date:</label>
                <input id="end-date" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
        </div>

        <!-- permit group -->
        <!-- heading -->
        <h3 class="text-sm font-medium text-gray-700">Permit Group:</h3>
        <div class="space-y-2 flex flex-wrap justify-between">

            <!-- create -->
            <div class="flex items-center space-x-4">
                <label for="create" class="w-32 text-sm font-medium text-gray-700">create:</label>
                <select id="create" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select group</option>
                <option>Project Lead</option>
                <option>Project Manager</option>
                <option>Developer</option>
                </select>
            </div>

            <!-- open -->
            <div class="flex items-center space-x-4">
                <label for="open" class="w-32 text-sm font-medium text-gray-700">open:</label>
                <select id="open" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select group</option>
                <option>Project Lead</option>
                <option>Project Manager</option>
                <option>Developer</option>
                </select>
            </div>

            <!-- todo list -->
            <div class="flex items-center space-x-4">
                <label for="create" class="w-32 text-sm font-medium text-gray-700">todo list:</label>
                <select id="create" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select group</option>
                <option>Project Lead</option>
                <option>Project Manager</option>
                <option>Developer</option>
                </select>
            </div>

            <!-- doing -->
            <div class="flex items-center space-x-4">
                <label for="create" class="w-32 text-sm font-medium text-gray-700">doing:</label>
                <select id="create" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select group</option>
                <option>Project Lead</option>
                <option>Project Manager</option>
                <option>Developer</option>
                </select>
            </div>

            <!-- done -->
            <div class="flex items-center space-x-4">
                <label for="create" class="w-32 text-sm font-medium text-gray-700">done:</label>
                <select id="create" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select group</option>
                <option>Project Lead</option>
                <option>Project Manager</option>
                <option>Developer</option>
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