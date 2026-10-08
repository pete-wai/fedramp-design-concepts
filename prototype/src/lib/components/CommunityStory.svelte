<script lang="ts">
let {story,short=false,expand=false,question=false}=$props<{story:any,short?:boolean,expand?:boolean,question?:boolean}>();
</script>
<article class="story" id={story.id}><h3>{question?story.question:story.title}</h3><p class="story-summary">{story.summary}</p>
{#if expand}<details><summary>Why it matters & sources</summary><p class="significance">{story.why}</p><ul class="source-links">{#each story.sources as s (s.url)}<li><a href={s.url}>{s.label} ↗</a></li>{/each}</ul></details>
{:else}{#if !short}<p class="significance">{story.why}</p>{/if}<ul class="source-links">{#each story.sources as s (s.url)}<li><a href={s.url}>{s.label} ↗</a></li>{/each}</ul>{/if}</article>
