<script lang="ts">
import {base} from '$app/paths';import {onMount} from 'svelte';import type {Snippet} from 'svelte';import {concept} from '$lib/community/concept';import '$lib/styles/i12-base.css';import '$lib/styles/i12.css';
let {children}=$props<{children:Snippet}>();let theme=$state('system');let ready=$state(false);onMount(()=>{theme=document.documentElement.dataset.themePreference||'system';ready=true;});
</script>
<div class={'i9 hub12 '+concept.slug} id="top">
<a class="skip" href="#main">Skip to main content</a>
<header class="community-masthead"><a href={base+'/'} aria-label="FedRAMP homepage"><img class="logo-light" src={base+'/fedramp-logo.svg'} alt="FedRAMP" width="132" height="44"/><img class="logo-dark" src={base+'/fedramp-logo-inverse.svg'} alt="FedRAMP" width="132" height="44"/></a><a class="masthead-title" href={base+'/community/'}>Community</a><label hidden={!ready}><span class="sr-only">Appearance</span><select aria-label="Appearance" bind:value={theme} onchange={()=>(window as any).fedrampTheme?.set(theme)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></header>
<nav class="topbar" aria-label="Community navigation"><a href={base+'/community/'}>Hub</a><a href={base+'/community/weekly/'}>Weekly editions</a><a href={base+'/community/#channels'}>Explore channels</a><a href="#top">Top ↑</a></nav>
<main id="main" tabindex="-1">{@render children()}</main>
<footer class="community-footer"><div><h2>Keep the conversation going.</h2><p>Meet, read, ask and contribute.</p><a href="https://github.com/FedRAMP/community/discussions">Join the community on GitHub ↗</a></div><div><p>Saved October 4, 2026.<br/>Experimental design, not the official website.<br/>Weekly editions are prototype editorial summaries.</p><a href={base+'/engineering/'}>Engineering Resources</a> · <a href={base+'/agency-use/'}>Agency Use</a><br/><a href={base+'/'}>FedRAMP homepage</a> · <a href="#top">Back to top</a></div></footer>
</div>
