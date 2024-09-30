<script>
    export let title = "";
    export let description = `It's empty here...`;
    export let rnumber = 1;

    export let handleView;
    export let handleEdit;
    export let isEditVisible;

    const truncateString = (str, length = 100) => {
        if (str.length > length) {
            return str.substring(0, length) + '...';
        }
        return str;
    }
</script>

<div class="flex flex-col shadow border">
    <div class="bg-white flex flex-col justify-start p-6 h-full">
        <span class="text-3xl font-bold hover:text-gray-700 pb-4">{title}</span>
       
        <span class="pb-6 block max-w-full break-words flex-grow">{truncateString(description ??= "-") }</span>
        <div class="flex flex-row justify-between"> 
          <div>{rnumber}</div>
          <div>
              <button on:click={handleView} class="text-gray-800 underline">View</button>
              {#if isEditVisible}
                <button on:click={handleEdit} class="text-red-500 underline">Edit</button>
              {/if}
          </div>
        </div>
    </div>
</div>
