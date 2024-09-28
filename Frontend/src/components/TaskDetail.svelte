<script>
    import { api } from '$lib/config.js';
    import { invalidate, invalidateAll, goto } from '$app/navigation';
    import { toasts } from 'svelte-toasts';

    export let taskId;
    export let taskName;
    export let taskDesc;
    export let taskState;
    export let taskPlan;
    export let taskCreator;
    export let taskOwner;
    export let taskCreatedDate;
    export let taskNotes; // displayed notes in field
    export let plans; // for dropdown


    let prevTaskPlan = taskPlan;
    let notes = ""; // entered notes
    

    $: displayNotes = taskNotes.split("§");
    $: {
        // console.log(displayNotes);
    }

    export let showModal = false;
    
    const state = {
        open: "open",
        todo: "todoList",
        doing: "doing",
        done: "done",
        close: "close",
    };

    // reload task detail data
    const handleReloadTaskDetail = async () => {  
        try {
            const response = await api.post("/task/getTaskDetail", { task_id: taskId });

            if (response.data.success) {
                const taskData = response.data.data;
                taskPlan = taskData.task_plan || "";
                prevTaskPlan = taskPlan;
                taskNotes = taskData.task_notes;
            }

        } catch (error) {
            // TODO: handle errors
            console.log(error);
        }
    }

    const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
		}
	};

    const handleSaveChanges = async () => {
        try {
            let displayMessage = 0;
            let toastMsg = "";

            // only check update task plan for open(PM) and done(PL) state 
            if (taskState === state.open || taskState === state.done) {
                // only update and log task if there is a change in the plan
                if (taskPlan !== prevTaskPlan) {
                    const data = {
                        task_id: taskId,
                        prev_plan: prevTaskPlan,
                        plan: taskPlan || null,
                        curr_state: taskState
                    }

                    const response = await api.patch("/task/updateTaskPlan", data);

                    if (response.data.success) {
                        displayMessage ++;
                        toastMsg = response.data.message;
                       
                        // showToast(true, response.data.message);
                        // showModal = false;
                        // invalidate('app:rootlayout');
                        // invalidate('app:kanban');
                    }
                }
            }

            // all states is able to update notes
            // update and log task notes
            if (notes) {
                const data = {
                    task_id: taskId,
                    notes: notes,
                    curr_state: taskState
                }

                const response = await api.patch("/task/updateTaskNotes", data);

                if (response.data.success) {
                    displayMessage ++;
                    toastMsg = response.data.message;
                    // showToast(true, response.data.message);
                    // showModal = false;
                    // invalidate('app:rootlayout');
                    // invalidate('app:kanban');
                }
            }

            if (displayMessage === 1) {
                showToast(true, toastMsg);
                // showModal = false;
                invalidate('app:rootlayout');
                invalidate('app:kanban');
                await handleReloadTaskDetail();
            } else if (displayMessage === 2) {
                showToast(true, "Both task plan and notes updated successfully");
                // showModal = false;
                invalidate('app:rootlayout');
                invalidate('app:kanban');
                await handleReloadTaskDetail();
            }

            displayMessage = 0;
            toastMsg = "";
            notes = "";

        } catch (error) {
            console.log(error);
        }

    };


    const checkDisabledPromote = () => {
       
        if (taskState === state.close) {
            return true;
        }

        return false;
    }

    const checkDisabledDemote = () => {
        if (taskState === state.open) {
            return true;
        }

        if (taskState === state.close) {
            return true;
        }

        return false;
    }

    // save => plan (open, done) and notes (all state except close?)
    // update plan in [open](PM) [done](PL) 
    // promote/demote => plan and notes + task state change
    // created, promote, demote tasks
    const handleDemote = async () => {
        try {
            let apiStr;

            // DEV (give up)
            if (taskState === state.doing) {
                apiStr = "demoteTask2TodoList";
            }

            // PL (revert state)
            if (taskState === state.done) {
                apiStr = "demoteTask2Doing";
            }

            const response = await api.patch(`/task/${apiStr}`, {task_id: taskId});
                
            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;
                document.body.classList.remove('overflow-hidden');
                invalidate('app:rootlayout');
                invalidate('app:kanban');
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handlePromote = async () => {
        // TODO: check which group is able to perform the actions in different states
        try {
            let apiStr;

            // PM (release task)
            if (taskState === state.open) {
                apiStr = "promoteTask2TodoList";
            }

            // DEV (take on task)
            if (taskState === state.todo) {
                apiStr = "promoteTask2Doing";
            }

            // DEV (request approval)
            if (taskState === state.doing) {
                apiStr = "promoteTask2Done";
            }

            // PL (approve)
            if (taskState === state.done) {
                apiStr = "promoteTask2Close";
            }

            if (taskState === state.close) {

            }

            const response = await api.patch(`/task/${apiStr}`, {task_id: taskId});
                
            if (response.data.success) {
                showToast(true, response.data.message);
                showModal = false;
                document.body.classList.remove('overflow-hidden');
                invalidate('app:rootlayout');
                invalidate('app:kanban');
            }

        } catch (error) {
            console.log(error);
        }
        
    };
    
</script>

<!-- Main Container -->
<!-- min-h-[95vh] -->
<div class="h-[95vh] min-w-[90vw] bg-gray-100 flex">
    <!-- Task Details Section (Left Side) -->
    <div class="w-1/4 border-r border-gray-200 bg-white p-6 h-full">
        <h1 class="text-xl font-semibold">Task Detail</h1>

        <!-- Task ID -->
        <p class="my-4 text-base"><span class="font-semibold">ID: </span>{taskId}</p>

        <!-- Task Name -->
        <p class="my-4 text-base"><span class="font-semibold">Name: </span>{taskName}</p>

        <!-- Task Description -->
        <div class="my-4">
            <p class="font-semibold">Description:</p>
            <textarea value={taskDesc} disabled class="w-full resize-none border border-gray-300 rounded-md p-2" id="description" name="description" rows="6" />
        </div>

        <!-- Task State -->
        <p class="my-4 text-base"><span class="font-semibold">State:</span> {taskState}</p>

        <!-- Plan Dropdown -->
        <div class="flex items-center space-x-2 my-4">
            <label for="plan" class="text-base font-medium text-gray-700">Plan:</label>
            
            <select 
                disabled={taskState !== state.open && taskState !== state.done}
                bind:value={taskPlan} id="plan" 
                    class="px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                    <option value="">Select plan</option>
                    {#each plans as {plan_mvp_name}}
                        <option value={plan_mvp_name}>{plan_mvp_name}</option>
                    {/each}
            </select>
        </div>

        <!-- Creator and Owner -->
        <p class="my-4 text-base"><span class="font-semibold">Creator:</span> {taskCreator}</p>
        <p class="my-4 text-base"><span class="font-semibold">Owner:</span> {taskOwner}</p>

        <!-- Created Date -->
        <p class="mt-4 text-base"><span class="font-semibold">Created date:</span> {taskCreatedDate}</p>
    </div>

    <!-- Notes Section (Right Side) -->
    <!-- h-full -->
    <div class="w-3/4 bg-white p-6 flex flex-col">
        <!-- Notes Label -->
        <label for="notes" class="block text-sm font-semibold mb-2" disabled>Notes:</label>

        <!-- Notes Field -->
        <div class="h-4/6 3xl:h-3/4 overflow-y-auto rounded-md border border-gray-300 bg-gray-100 text-gray-800 p-4">
            <!-- <p class="text-center text-gray-400">Notes Field</p> -->
            {#each displayNotes as note} 
                <p>{@html note}</p><br />
            {/each}
        </div>

        <!-- Input for adding notes -->
        <div class="h-2/6 3xl:h-1/4">
            <div class="mt-4">
                <textarea bind:value={notes} rows="4" placeholder="Enter notes here..." class="w-full resize-none rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50"></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 flex justify-end space-x-4">
                <button
                    on:click={() => {
                        showModal = false;
                        document.body.classList.remove('overflow-hidden');
                    }} 
                    class="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">Close
                </button>
                
                <button 
                    on:click={handleSaveChanges}
                    class="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Save Changes
                </button>
                
                <button
                    disabled={checkDisabledDemote()}
                    on:click={handleDemote}
                    class="rounded-md bg-primary px-4 py-2 text-white hover:bg-blue-700
                        disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">Demote
                </button>

                <button 
                    disabled={checkDisabledPromote()}
                    on:click={handlePromote}
                    class="rounded-md bg-primary px-4 py-2 text-white hover:bg-blue-700
                    disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">Promote
                </button>
            </div>
        </div>
    </div>
   
</div>
