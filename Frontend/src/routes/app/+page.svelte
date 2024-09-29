<script>
    import { goto } from '$app/navigation';
    import { pageStore } from '$lib/stores';

    import { api } from '$lib/config.js';

    import AppCard from '$components/AppCard.svelte';
    import Modal from "$components/Modal.svelte";
    import AppForm from "$components/AppForm.svelte";


    /** @type {import('./$types').PageData} */
    export let data;
    $: apps = data.apps;
    $: groups = data.groups;
    $: isPL = data.userData?.isPL;

    // for create app modal
    let showAppModal = false;
    // for edit app modal
    let showEditAppModal = false;
    
    // let groups = [];

    let editData = {};

    const handleViewApp = (app_acronym) => {
        $pageStore = app_acronym;
        // pageStore.set(app_acronym);
        goto("/kanban", { replaceState: true });

        // goto("/kanban", { state: { myData: 'Hello from previous page!' } });
    }

    const handleEditApp = async (app_acronym) => {
        try {
            const response = await api.post("/app/getApp", { acronym: app_acronym });
            
            if (response.data.success) {
                editData = response.data.data;
                showEditAppModal = true;
            }

        } catch (error) {
            // TODO: handle errors;
            console.log(error);
        }
    }
</script>

<div class="w-full relative">
    <!-- app list page -->
    <div class="min-h-full mx-auto max-w-[90rem]">
        <div class="flex flex-col mt-5">
            <div class="flex justify-end">
                {#if isPL}
                    <button 
                        on:click={() => {
                            showAppModal = true;
                        }} 
                        class="px-4 py-2 text-base font-semibold text-white bg-primary rounded-lg shadow-md">
                            Create app
                    </button>
                {/if}
            </div>
            
            <!-- display application cards -->
            <div class="p-8 ">
                <div class="grid md:grid-cols-4 sm:grid-cols-2 gap-8">
                    {#each apps as app (app.app_acronym)}
                        <AppCard 
                            handleView={() => handleViewApp(app.app_acronym)}
                            handleEdit={() => handleEditApp(app.app_acronym)}
                            title={app.app_acronym} 
                            description={app.app_description} 
                            rnumber={app.app_rnumber}/>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <Modal showModal={showAppModal}>
        <AppForm 
            title={"Create App"}
            groups={groups} 
            bind:showModal={showAppModal}
        />
    </Modal>

    <Modal showModal={showEditAppModal}>
        <AppForm 
            title={"Edit App"}
            acronym={editData.app_acronym}
            description={editData.app_description}
            rnumber={editData.app_rnumber}
            startDate={editData.app_startDate}
            endDate={editData.app_endDate}
            permit_create={editData.app_permit_create ??= ""}
            permit_open={editData.app_permit_open ??= ""}
            permit_todolist={editData.app_permit_todoList ??= ""}
            permit_doing={editData.app_permit_doing ??= ""}
            permit_done={editData.app_permit_done ??= ""}
            isEdit={true}
            groups={groups} 
            bind:showModal={showEditAppModal}
        />
    </Modal>

</div>
