<script lang="ts">
import Detail from '$lib/components/CommunityDetail.svelte';
let {data}=$props();
const articles=import.meta.glob('/src/lib/community/articles/*.svelte.md',{eager:true,import:'default'}) as Record<string,any>;
let Content=$derived(articles['/src/lib/community/articles/'+data.item.id+'.svelte.md']);
</script>
<Detail item={data.item}><Content/></Detail>
