<script>
	import { page } from '$app/stores';
</script>

<main class="w-full relative">
    <div class="min-h-full mx-auto lg:max-w-[118rem] max-w-[90rem] px-8">
        <h1>{$page.error.message}...</h1>
    </div>
</main>