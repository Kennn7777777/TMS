<script>
    export let taskName;
    export let description = "";
    export let taskOwner = "";
    export let color = "000000"

    export let handleView;

    const truncateString = (str, length = 90) => {
        if (str.length > length) {
            return str.substring(0, length) + '...';
        }
        return str;
    }
</script>

<!-- h-[9rem] -->
<div class="flex flex-col mb-4 rounded-sm border border-l-4 bg-gray-50 p-3 shadow-sm w-full " style="border-left-color: #{color}; ">
    <h3 class="mb-2 font-semibold">{taskName}</h3>
    <p class="flex-grow text-sm text-gray-600">{truncateString(description)}</p>
    <div class="mt-2 flex items-center justify-between">
      <span class="text-sm text-gray-500">{taskOwner}</span>
      <button
        on:click={handleView}
        class="text-sm text-gray-800 underline">View</button>
    </div>
</div>