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
    export let taskNotes;
    export let plans;

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
        <p class="my-4 text-sm"><span class="font-semibold">ID: </span>{taskId}</p>

        <!-- Task Name -->
        <p class="my-4 text-sm"><span class="font-semibold">Name: </span>{taskName}</p>

        <!-- Task Description -->
        <div class="my-4">
            <p class="font-semibold">Description:</p>
            <textarea value={"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Some random description......."} class="w-full resize-none border border-gray-300 rounded-md p-2" id="description" name="description" rows="4" />
        </div>

        <!-- Task State -->
        <p class="my-4 text-sm"><span class="font-semibold">State:</span> {taskState}</p>

        <!-- Plan Dropdown -->
        <div class="flex items-center space-x-2 my-4">
            <label for="plan" class="text-sm font-medium text-gray-700">Plan:</label>
            
            <select bind:value={taskplan} id="plan" class="px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select plan</option>
                {#each plans as {plan_mvp_name}}
                    <option value={plan_mvp_name}>{plan_mvp_name}</option>
                {/each}
            </select>

        </div>

        <!-- Creator and Owner -->
        <p class="my-4 text-sm"><span class="font-semibold">Creator:</span> {taskCreator}</p>
        <p class="my-4 text-sm"><span class="font-semibold">Owner:</span> {taskOwner}</p>

        <!-- Created Date -->
        <p class="mt-4 text-sm"><span class="font-semibold">Created date:</span> {taskCreatedDate}</p>
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
                    document.body.classList.remove('overflow-hidden');
                }} 
                class="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">Close</button>
            <button class="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Save Changes</button>
            <button class="cursor-not-allowed rounded-md bg-gray-300 px-4 py-2 text-gray-500" disabled>Demote</button>
            <button class="rounded-md bg-primary px-4 py-2 text-white hover:bg-blue-700">Promote</button>
        </div>
    </div>
   
</div>
