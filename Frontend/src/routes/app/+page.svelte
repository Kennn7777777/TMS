<script>
    import { invalidate, invalidateAll, goto } from '$app/navigation';
    import { pageStore } from '$lib/stores';
    import { api } from '$lib/config.js';
    import { toasts } from 'svelte-toasts';
    

    import AppCard from '$components/AppCard.svelte';
    import Modal from "$components/Modal.svelte";
    import AppForm from "$components/AppForm.svelte";

    /** @type {import('./$types').PageData} */
    export let data;
    $: apps = data.apps;
    $: groups = data.groups;
    $: isPL = data.userData?.isPL;

    // create app modal
    let showAppModal = false;
    // edit app modal
    let showEditAppModal = false;

    let editData = {};

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

    const handleViewApp = async (app_acronym) => {
        try {
            const response = await api.get('/users/getUser');
            if (response.data.success) {
                $pageStore = app_acronym;
                goto("/kanban", { replaceState: true });
            }
        } catch (error) {
            const message = error.response?.data?.message || 'An unexpected error occurred';
            
            if (error.response?.data?.code === 'ERR_AUTH') {
                await logOut();
                showToast(false, message);
            } else {
                showToast(false, message);
            }
       
        }
    }

    // retrieve app details to populate field
    const handleEditApp = async (app_acronym) => {
        try {
            const response = await api.post("/app/getApp", { acronym: app_acronym });
            
            if (response.data.success) {
                editData = response.data.data;
                showEditAppModal = true;
            }

        } catch (error) {
            const message = error.response?.data?.message || 'An unexpected error occurred';

            if (error.response?.data?.code === 'ERR_PERMISSION') {
                showEditAppModal = false;
                invalidate('app:rootlayout');
                invalidate('app:applist');
                await goto('/app', { noScroll: false, replaceState: true });        
                showToast(false, message);    
            } else if (error.response?.data?.code === 'ERR_AUTH') {
                await logOut();
				showToast(false, message);
            } else {
                showEditAppModal = false;
                showToast(false, message);    
            }
        }
    }
</script>

<div class="w-full relative">
    <!-- app list page -->
    <div class="min-h-full mx-auto lg:max-w-[118rem] max-w-[90rem]">
        <div class="flex flex-col mt-5">
            <div class="flex justify-end px-8">
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
                            isEditVisible={isPL}
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

    {#if isPL}
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
    {/if}
</div>
