<script>
    import AppCard from '$components/AppCard.svelte';
    import Modal from "$components/Modal.svelte";
    import AppForm from "$components/AppForm.svelte";


    /** @type {import('./$types').PageData} */
    export let data;
    $: apps = data.apps;

    let showAppModal = false;
    let modalTitle = "Create App";

    const handleCreateApp = () => {

    }

</script>

<div class="w-full relative">
    <!-- App -->
    <div class="min-h-full mx-auto max-w-[90rem]">
        <div class="flex flex-col mt-5">
            <div class="flex justify-end">
                <button 
                    on:click={() => {
                        showAppModal = true;
                    }} 
                    class="px-4 py-2 text-base font-semibold text-white bg-primary rounded-lg shadow-md">
                        Create app
                </button>
            </div>
            
            <div class="p-8">
                <div class="grid md:grid-cols-3 sm:grid-cols-1 gap-8">
                    {#each apps as app (app.app_acronym)}
                        <AppCard title={app.app_acronym} description={app.app_description} rnumber={app.app_rnumber}/>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <Modal showModal={showAppModal}>
        <AppForm 
            title={modalTitle} 
            handleSubmit={handleCreateApp}
            bind:showModal={showAppModal}
        />
    </Modal>

</div>
