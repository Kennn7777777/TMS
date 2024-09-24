<script>
    export let title = "";
    export let description = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus quis porta dui. Ut eu
            iaculis massa. Sed ornare ligula lacus, quis iaculis dui porta volutpat. In sit amet posuere magna..`;
    export let rnumber = 1;
</script>

<!-- max-w-[400px] -->
<div class="flex flex-col shadow border">
    <div class="bg-white flex flex-col justify-start p-6">
        <span class="text-3xl font-bold hover:text-gray-700 pb-4">{title}</span>
       
        <span class="pb-6">{description}</span>
        <div class="flex flex-row justify-between"> 
          <div>{rnumber}</div>
          <div>
              <a href="#" class="text-gray-800 underline">View</a>
              <a href="#" class="text-red-500 underline">Edit</a>
          </div>
        </div>
    </div>
</div>
