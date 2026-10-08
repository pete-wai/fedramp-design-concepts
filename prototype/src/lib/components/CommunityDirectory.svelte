<script lang="ts">
import {base} from '$app/paths';import {channels,formatDate} from '$lib/community/channels';import snapshot from '$lib/community/data.json';
let {compact=false}=$props<{compact?:boolean}>();
</script>
<section class:compact class="directory" id="channels"><div class="section-intro"><h2>Find your place<br/>in the community.</h2><p>Different spaces. A shared purpose: useful information, openly available.</p></div><div class="channel-directory">{#each channels as c (c.id)}{@const latest=snapshot.items.find(x=>x.channel===c.id && x.date<=snapshot.asOf)}<article><h3><a href={base+'/community/'+c.id+'/'}>{c.name} <span aria-hidden="true">↗</span></a></h3><p>{c.description}</p><a class="channel-action" href={base+'/community/'+c.id+'/'}>{c.action} →</a>{#if latest&&!compact}<small>Latest in this snapshot · {formatDate(latest.date)}<br/><a href={base+latest.route}>{latest.title}</a></small>{/if}</article>{/each}</div></section>
