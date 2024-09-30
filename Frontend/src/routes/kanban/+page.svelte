<script>
    import { page } from '$app/stores';
    import { api } from '$lib/config.js';
    import { invalidate, invalidateAll, goto } from '$app/navigation';
    import { toasts } from 'svelte-toasts';

    import TaskCard from "$components/TaskCard.svelte";
    import Modal from "$components/Modal.svelte";
    import TaskForm from "$components/TaskForm.svelte";
    import PlanForm from "$components/PlanForm.svelte";
    import TaskDetail from "$components/TaskDetail.svelte";

    /** @type {import('./$types').PageData} */
	export let data;

    $: openTasks = data.openTasks;
    $: todoTasks = data.todoTasks;
    $: doingTasks = data.doingTasks;
    $: doneTasks = data.doneTasks;
    $: closeTasks = data.closeTasks;
    $: app_acronym = data.app_acronym;
    $: username = data.userData.username;
    $: plans = data.plans;
    $: isPM = data.userData.isPM;
    $: isPermitCreate = data.isPermitCreate;

    // popup modals
    let showTaskModal = false;
    let showPlanModal = false;
    let showEditPlanModal = false;
    let showTaskDetail = false;

    let editData = {};
    let taskData = {};
    let allowActions = [];

    
    const showToast = (success, messageDesc) => {
		if (success) {
			toasts.success('', messageDesc, { duration: 3000, theme: 'light' });
		} else {
			toasts.error('', messageDesc, { duration: 3000, theme: 'light' });
		}
	};

    const logOut = async () => {
		try {
			const response = await api.get('/auth/logout');

			if (response.data.success) {
				await goto('/login', { noScroll: false, replaceState: true });
			}
		} catch (error) {
			console.log(error);
		}
	};

    const handleEditPlan = async (plan_name) => {
        try {
            const data = {
                mvp_name: plan_name,
                app_acronym: app_acronym
            }

            const response = await api.post("/plan/getPlan", data);

            if (response.data.success) {
                editData = response.data.data;
                showEditPlanModal = true;
            }

        } catch (error) {
            const message = error.response?.data?.message || 'An unexpected error occurred';

            if (error.response?.data?.code === 'ERR_PERMISSION') {
                showEditPlanModal = false;
                invalidate('app:rootlayout');
                invalidate('app:kanban');
                await goto('/kanban', { noScroll: false, replaceState: true });        
                showToast(false, message);    
            } else if (error.response?.data?.code === 'ERR_AUTH') {
                await logOut();
				showToast(false, message);
            } else {
                showToast(false, message);
            }

        }
    }

    const handleViewTaskDetail = async (task_id) => {  
        try {
            const response = await api.post("/task/getTaskDetail", { task_id: task_id });

            if (response.data.success) {
                taskData = response.data.data;
                allowActions = response.data.allowActions;
                
                showTaskDetail = true;
                document.body.classList.add('overflow-hidden');
            }

        } catch (error) {
            if (error.response?.data?.code === 'ERR_PERMISSION') {
                showTaskDetail = false;
                invalidate('app:rootlayout');
                invalidate('app:kanban');
                await goto('/kanban', { noScroll: false, replaceState: true });        
                showToast(false, message);    
            } else if (error.response?.data?.code === 'ERR_AUTH') {
                await logOut();
				showToast(false, message);
            } else {
                showToast(false, message);
            }
        }
    }

</script>

<div class="w-full relative">
    <div class="min-h-full bg-gray-100 p-4">
        <div class="flex items-center justify-end mb-2">
            {#if isPermitCreate}
                <button
                    on:click={() => {
                        showTaskModal = true;
                    }}
                    class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                    >Create Task</button
                >
            {/if}
            
            
            <div class="group relative cursor-pointer py-2">
                <div class="relative ml-3">
                    <div>
                        <button
                            disabled={!isPM}
                            type="button"
                            class="relative flex rounded-md bg-primary px-10 py-2 text-sm font-medium text-white hover:bg-blue-60"
                            id="user-menu-button"
                            aria-expanded="false"
                            aria-haspopup="true"
                        >
                            <span class="absolute -inset-1.5"></span>
                            <span class="sr-only">Open user menu</span>
                            Plan
                        </button>
                    </div>
                </div>

                <!-- plan dropdown menu -->
                <div
                    class="invisible absolute mt-2 right-0 z-[99] flex flex-col bg-gray-100 px-4 py-1 text-gray-800 shadow-xl group-hover:visible items-start"
                >
                    {#each plans as {plan_mvp_name}(plan_mvp_name)}
                        <button 
                            on:click={() => handleEditPlan(plan_mvp_name)}
                            class="my-2 w-full text-start border-b border-gray-100 py-1 font-semibold text-gray-500 hover:text-black md:mx-2">
                            {plan_mvp_name}
                        </button>   
                    {/each}

                    <!-- create new plan -->
                    {#if isPM}
                    <button 
                        on:click={() => {
                            showPlanModal = true;
                        }}
                        class="my-2 text-nowrap border-b border-gray-100 py-1 font-semibold text-gray-500 hover:text-black md:mx-2">
                        Create new Plan
                    </button>      
                    {/if}     
                </div>
            </div>            
        </div>

        <!-- kanban board -->
        <div class="grid grid-cols-5 gap-4 ">
            <!-- open state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Open</h2>
                
                <!-- task Card -->
                {#if openTasks.length > 0}
                    {#each openTasks as task (task.task_id)}
                        <TaskCard
                            handleView={() => handleViewTaskDetail(task.task_id)} 
                            taskName={task.task_name}
                            description={task.task_description ??= '-'}
                            taskOwner={task.task_owner}
                            color={task.plan_colour ??= "000000"}/>
                    {/each}
                {:else}
                    <span class="text-base">No tasks here...</span>
                {/if}
                
            </div>

            <!-- todo state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Todo</h2>
                
                <!-- task Card -->
                {#if todoTasks.length > 0}
                    {#each todoTasks as task (task.task_id)}
                        <TaskCard 
                            handleView={() => handleViewTaskDetail(task.task_id)}
                            taskName={task.task_name} 
                            description={task.task_description ??= '-'} 
                            taskOwner={task.task_owner} 
                            color={task.plan_colour ??= "000000"}/>
                    {/each}
                {:else}
                    <span class="text-base">No tasks here...</span>
                {/if}
               
            </div>

            <!-- doing state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Doing</h2>
                
                <!-- task Card -->
                {#if doingTasks.length > 0}
                    {#each doingTasks as task (task.task_id)}
                        <TaskCard 
                            handleView={() => handleViewTaskDetail(task.task_id)}
                            taskName={task.task_name} 
                            description={task.task_description ??= '-'} 
                            taskOwner={task.task_owner} 
                            color={task.plan_colour ??= "000000"}/>
                    {/each}
                {:else}
                    <span class="text-base">No tasks here...</span>
                {/if}
            </div>

            <!-- done state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Done</h2>
                
                <!-- task Card -->
                {#if doneTasks.length > 0}
                    {#each doneTasks as task (task.task_id)}
                        <TaskCard 
                            handleView={() => handleViewTaskDetail(task.task_id)}
                            taskName={task.task_name} 
                            description={task.task_description ??= '-'} 
                            taskOwner={task.task_owner} 
                            color={task.plan_colour ??= "000000"}/>
                    {/each}
                {:else}
                    <span class="text-base">No tasks here...</span>
                {/if}
                
            </div>

            <!-- close state -->
            <div class="column rounded-lg bg-white p-4 shadow-md flex flex-col items-center">
                <h2 class="mb-4 text-lg font-semibold">Close</h2>
                
                <!-- task Card -->
                {#if closeTasks.length > 0}
                    {#each closeTasks as task (task.task_id)}
                        <TaskCard 
                            handleView={() => handleViewTaskDetail(task.task_id)}
                            taskName={task.task_name} 
                            description={task.task_description ??= '-'} 
                            taskOwner={task.task_owner} 
                            color={task.plan_colour ??= "000000"}/>
                    {/each}
                {:else}
                    <span class="text-base">No tasks here...</span>
                {/if}
     
            </div>
        </div>
    </div>

    <!-- Task Create Modal -->
    {#if isPermitCreate}
        <Modal showModal={showTaskModal}>
            <TaskForm
                acronym={app_acronym}  
                username={username}
                plans={plans}
                bind:showModal={showTaskModal}
            />
        </Modal>
    {/if}

    <!-- Plan Create Modal -->
    <Modal showModal={showPlanModal}>
        <PlanForm
            app_acronym={app_acronym}
            bind:showModal={showPlanModal}
            isPM={isPM}
        />
    </Modal>

    <!-- Plan Edit Modal -->
    <Modal showModal={showEditPlanModal}>
        <PlanForm
            title={"Edit Plan"}
            app_acronym={app_acronym}
            name={editData.plan_mvp_name}
            startDate={editData.plan_startDate}
            endDate={editData.plan_endDate}
            colour={`#${editData.plan_colour}`}
            isEdit={true}
            isPM={isPM}
            bind:showModal={showEditPlanModal}
        />
    </Modal>


    <!-- Task details Modal -->
   <Modal showModal={showTaskDetail}>
        <TaskDetail
            taskId={taskData.task_id}
            taskName={taskData.task_name}
            taskDesc={taskData.task_description ??= "-"}
            taskState={taskData.task_state}
            taskPlan={taskData.task_plan ??= ""}
            taskCreator={taskData.task_creator}
            taskOwner={taskData.task_owner}
            taskCreatedDate={taskData.task_createdDate}
            taskNotes={taskData.task_notes ??= ""}
            plans={plans}
            allowActions={allowActions}
            bind:showModal={showTaskDetail}/>
   </Modal>
</div>

<style>
    .column {
        min-height: calc(100vh - 140px); 
    }
</style>