<script>
    export let showModal = false;
   
</script>

<!-- show popup modal -->
{#if showModal}
    <div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-[100]">
        <slot />
    </div>
{/if}