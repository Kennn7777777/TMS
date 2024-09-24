<script>
    import { page } from '$app/stores';

    import TaskCard from "$components/TaskCard.svelte";
    import Modal from "$components/Modal.svelte";
    import TaskForm from "$components/TaskForm.svelte";
    import PlanForm from "$components/PlanForm.svelte";
    import TaskDetail from "$components/TaskDetail.svelte";
	import { onMount } from 'svelte';

    /** @type {import('./$types').PageData} */
	export let data;

    const openTasks = data.openTasks;
    const todoTasks = data.todoTasks;
    const doingTasks = data.doingTasks;
    const doneTasks = data.doneTasks;
    const closeTasks = data.closeTasks;

    $: {
        console.log(openTasks);
    }

    let showTaskModal = false;
    let showPlanModal = false;
    let showTaskDetail = false;

    const handleCreateTask = () => {

    }

    const handleCreatePlan = () => {

    }

    onMount(() => {
        // console.log($page.state.app);
    });

</script>

<div class="w-full relative">
    <div class="min-h-full bg-gray-100 p-4">

        <!-- TODO: display only to those authorized -->
        <div class="flex items-center justify-end mb-2">
            <button
                on:click={() => {
                    showTaskModal = true;
                }}
                class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >Create Task</button
            >

            <button
                on:click={() => {
                    showPlanModal = true;
                }}
                class="ml-2 rounded-md bg-primary px-10 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >Plan</button
            >
        </div>

        <div class="grid grid-cols-5 gap-4">
            <!-- open state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Open</h2>
                
                <!-- Task Card -->
                {#each openTasks as task}
                    <TaskCard taskName={task.task_name} description={task.task_description ??= '-'} taskOwner={task.task_owner} color={task.plan_colour ??= "000000"}/>
                {/each}
                
            </div>

            <!-- todo state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Todo</h2>
                
                <!-- Task Card -->
                {#each todoTasks as task}
                    <TaskCard taskName={task.task_name} description={task.task_description ??= '-'} taskOwner={task.task_owner} color={task.plan_colour ??= "000000"}/>
                {/each}
               
            </div>

            <!-- doing state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Doing</h2>
                
                <!-- Task Card -->
                {#each doingTasks as task}
                    <TaskCard taskName={task.task_name} description={task.task_description ??= '-'} taskOwner={task.task_owner} color={task.plan_colour ??= "000000"}/>
                {/each}
                
            </div>

            <!-- done state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Done</h2>
                
                <!-- Task Card -->
                {#each doneTasks as task}
                    <TaskCard taskName={task.task_name} description={task.task_description ??= '-'} taskOwner={task.task_owner} color={task.plan_colour ??= "000000"}/>
                {/each}
                
            </div>

            <!-- close state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Close</h2>
                
                <!-- Task Card -->
                {#each closeTasks as task}
                    <TaskCard taskName={task.task_name} description={task.task_description ??= '-'} taskOwner={task.task_owner} color={task.plan_colour ??= "000000"}/>
                {/each}
     
            </div>
        </div>
    </div>

    <!-- TODO: only display to authorized groups -->
    <!-- Task Modal -->
    <Modal showModal={showTaskModal}>
        <TaskForm  
            handleSubmit={handleCreateTask}
            bind:showModal={showTaskModal}
        />
    </Modal>

    <!-- Plan Modal -->
    <Modal showModal={showPlanModal}>
        <PlanForm
            handleSubmit={handleCreatePlan}
            bind:showModal={showPlanModal}
        />
    </Modal>

    <!-- Task details Modal -->
   <Modal showModal={showTaskDetail}>
        <TaskDetail 
            bind:showModal={showTaskDetail}/>
   </Modal>

</div>

<style>
    .column {
        min-height: calc(100vh - 140px); 
    }
</style>