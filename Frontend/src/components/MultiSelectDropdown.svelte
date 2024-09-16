<script>
	export let items = []; // Array of items for dropdown
	export let selectedItems = []; // Preselected items
	export let label = 'Select Items'; // Default label for the dropdown button

	export let isOpen = false;

	const toggleDropdown = () => {
		if (items.length > 0) {
			isOpen = !isOpen;
		}
	};

	const handleCheckbox = (event, itemValue) => {
		if (event.target.checked) {
			// const index = items.indexOf(itemValue);
			// selectedItems = [...selectedItems.slice(0, index), itemValue, ...selectedItems.slice(index)];
			selectedItems = [...selectedItems, itemValue];
		} else {
			selectedItems = selectedItems.filter((item) => item !== itemValue);
		}
		// console.log(selectedItems);
	};

	$: selectedLabels = selectedItems.map(
		(item) => items.find((i) => i.group_id === item)?.group_name
	);
	$: buttonLabel = selectedItems.length > 0 ? selectedLabels.join(', ') : label;
</script>

<div class="relative inline-block text-left">
	<button
		on:click={toggleDropdown}
		disabled={items.length === 0}
		class="disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-700 bg-white border px-2 py-1.5 border-gray-300 rounded-md shadow-smrounded-md focus:outline-none min-w-40"
	>
		{buttonLabel}

		<svg xmlns="http://www.w3.org/2000/svg" class="w-3 fill-black inline ml-3" viewBox="0 0 24 24">
			<path
				fill-rule="evenodd"
				d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
				clip-rule="evenodd"
				data-original="#000000"
			/>
		</svg>
	</button>

	<!-- Dropdown menu -->
	{#if isOpen}
		<div class="absolute w-44 bg-white border z-10">
			<div class="p-2 max-h-40 overflow-y-auto">
				{#each items as item}
					<label class="flex items-center py-1">
						<input
							type="checkbox"
							checked={selectedItems.includes(item.group_id)}
							on:change={(event) => handleCheckbox(event, item.group_id)}
							class="h-4 w-4 text-blue-600"
						/>
						<span class="ml-2 text-gray-800">{item.group_name}</span>
					</label>
				{/each}
			</div>
		</div>
	{/if}
</div>
