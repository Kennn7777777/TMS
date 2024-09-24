<script>
    import { goto } from '$app/navigation';

    export let taskId;
    export let taskName;
    export let taskDesc;
    export let taskState;
    export let taskplan;
    export let taskCreator;
    export let taskOwner;
    export let taskCreatedDate;

    export let showModal = false;

    export let handleSaveChanges = () => {};
    export let handleDemote = () => {};
    export let handlePromote = () => {};
    

</script>


<!-- Main Container -->
<div class="min-h-[90vh] min-w-[90vw] bg-gray-100 flex">
    <!-- Task Details Section (Left Side) -->
    <div class="w-1/4 border-r border-gray-200 bg-white p-6">
        <h1 class="text-xl font-semibold">Task Detail</h1>

        <!-- Task ID -->
        <p class="my-4 text-sm"><span class="font-semibold">ID:</span> &lt;Task_id&gt;</p>

        <!-- Task Name -->
        <p class="my-4 text-sm"><span class="font-semibold">Name:</span> &lt;Task_name&gt;</p>

        <!-- Task Description -->
        <div class="my-4">
            <p class="font-semibold">Description:</p>
            <p class="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Some random description.......</p>
        </div>

        <!-- Task State -->
        <p class="my-4 text-sm"><span class="font-semibold">State:</span> Open</p>

        <!-- Plan Dropdown -->
        <div class="flex items-center space-x-2 my-4">
            <label for="plan" class="text-sm font-medium text-gray-700">Plan:</label>
            
            <select id="plan" class="px-3 py-2 border border-gray-300 rounded-md">
                <option>Select plan</option>
                <option>Plan 1</option>
                <option>Plan 2</option>
                <option>Plan 3</option>
            </select>
        </div>

        <!-- Creator and Owner -->
        <p class="my-4 text-sm"><span class="font-semibold">Creator:</span> &lt;creator_username&gt;</p>
        <p class="my-4 text-sm"><span class="font-semibold">Owner:</span> &lt;owner_username&gt;</p>

        <!-- Created Date -->
        <p class="mt-4 text-sm"><span class="font-semibold">Created date:</span> 01/12/2023</p>
    </div>

    <!-- Notes Section (Right Side) -->
    <div class="w-3/4 bg-white p-6 flex flex-col">
        <!-- Notes Label -->
        <label for="notes" class="block text-sm font-semibold">Notes:</label>

        <!-- Notes Field -->
        <div class="flex-1 mt-2 h-64 rounded-md border border-gray-300 bg-gray-50 p-4">
            <p class="text-center text-gray-400">Notes Field</p>

        </div>

        <!-- Input for Adding Notes -->
        <div class="mt-4">
            <textarea rows="4" placeholder="Enter notes here..." class="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex justify-end space-x-4">
            <button
                on:click={() => {
                    showModal = false;
                }} 
                class="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">Close</button>
            <button class="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Save Changes</button>
            <button class="cursor-not-allowed rounded-md bg-gray-300 px-4 py-2 text-gray-500" disabled>Demote</button>
            <button class="rounded-md bg-primary px-4 py-2 text-white hover:bg-blue-700">Promote</button>
        </div>
    </div>
   
</div>
