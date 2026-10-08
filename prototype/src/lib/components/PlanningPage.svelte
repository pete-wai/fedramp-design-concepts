<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import '$lib/styles/i12-base.css';
  import '$lib/styles/planning.css';
  let { kind } = $props<{ kind: 'engineering' | 'agency' }>();
  const engineering = [
    {id:'connect',title:'Connect the work you already do',question:'Where could existing engineering work become useful evidence?',body:'A proposed starting point for mapping identity, deployment and vulnerability workflows to the questions an assurance team needs to answer.',example:'Example placeholder: a deployment record paired with a readable explanation of what changed.',next:'Proposed resource: an annotated evidence walkthrough.'},
    {id:'explain',title:'Explain the evidence',question:'What makes a technical signal understandable to someone outside your team?',body:'A proposed guide to context, ownership, timestamps and limitations. The goal is to make an example easy to inspect and discuss.',example:'Example placeholder: a sample signal with its source, collection time and known gaps.',next:'Proposed resource: an example gallery with annotations.'},
    {id:'maintain',title:'Keep the picture current',question:'How could a team explain a change without rebuilding its story?',body:'A proposed view that connects an operational change to the evidence and explanation it affects.',example:'Example placeholder: a before-and-after change record with links to affected evidence.',next:'Proposed resource: a change walkthrough.'}
  ];
  const agency = [
    {id:'mission',title:'Start with the mission',question:'What are you trying to accomplish?',body:'A proposed orientation step for describing the intended use, the people involved and the questions that need an answer.',example:'Discussion prompt: what would your team need to know before considering this service?',next:'Proposed resource: a short mission and use worksheet.'},
    {id:'review',title:'Understand the available information',question:'What information would help the team make its decision?',body:'A proposed reading guide that brings the relevant sources into view and explains where to find more detail.',example:'Discussion prompt: which information is reusable, and which questions are specific to your use?',next:'Proposed resource: an annotated information map.'},
    {id:'decide',title:'Plan the agency handoff',question:'Who needs to be involved next?',body:'A proposed handoff view for organizing unresolved questions, owners and next conversations.',example:'Discussion prompt: what remains unanswered, and who is best placed to answer it?',next:'Proposed resource: a decision conversation outline.'}
  ];
  let isEngineering = $derived(kind === 'engineering');
  let title = $derived(isEngineering ? 'Engineering Resources' : 'Agency Use');
  let paths = $derived(isEngineering ? engineering : agency);
  let selected = $state('');
  let active = $derived(paths.find(p => p.id === selected) ?? paths[0]);
  let marked = $state<string[]>([]);
  let ready = $state(false);
  let theme = $state('system');
  onMount(() => { ready = true; theme = document.documentElement.dataset.themePreference || 'system'; });
</script>

<svelte:head><title>{title} — planning prototype · FedRAMP</title><meta name="description" content={'Explore a clearly labeled '+title+' planning prototype. Illustrative content, not official guidance.'}/></svelte:head>
<div class="hub12 planning" class:agency-planning={!isEngineering} id="top">
  <a class="skip" href="#main">Skip to main content</a>
  <header class="plan-masthead">
    <a href={base+'/'} aria-label="FedRAMP homepage"><img class="logo-light" src={base+'/fedramp-logo.svg'} alt="FedRAMP" width="132" height="44"/><img class="logo-dark" src={base+'/fedramp-logo-inverse.svg'} alt="FedRAMP" width="132" height="44"/></a>
    <label hidden={!ready}><span class="sr-only">Appearance</span><select aria-label="Appearance" bind:value={theme} onchange={() => (window as any).fedrampTheme?.set(theme)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
  </header>
  <nav class="plan-nav" aria-label="Planning navigation"><a href={base+'/community/'}>Community</a><a href={base+'/engineering/'} aria-current={isEngineering?'page':undefined}>Engineering</a><a href={base+'/agency-use/'} aria-current={!isEngineering?'page':undefined}>Agency Use</a><a href="#top">Top ↑</a></nav>
  <main id="main" tabindex="-1">
    <header class="plan-opening">
      <h1>{title}<strong>{isEngineering?'From practice to evidence.':'From mission to decision.'}</strong></h1>
      <p class="plan-intro">{isEngineering?'Explore a possible home for practical walkthroughs, examples and engineering references.':'Explore a possible guide to the questions, information and conversations behind an agency’s cloud use decision.'}</p>
      <p class="prototype-note"><strong>Placeholder · interactive planning prototype.</strong> These outlines and examples are proposed content, not FedRAMP requirements or official guidance. No tools, submissions or decisions are connected.</p>
    </header>
    <section class="plan-workspace" aria-labelledby="try-heading">
      <div class="plan-rail"><h2 id="try-heading">{isEngineering?'What are you working on?':'Walk through a possible journey.'}</h2><p>{isEngineering?'Choose a task to preview the kind of resource this section could provide.':'Choose a stage to explore. This is a proposed navigation sequence, not an authorization procedure.'}</p>
        <div class="plan-choices" role="group" aria-label="Preview a planning approach" hidden={!ready}>
          {#each paths as path, i (path.id)}<button aria-pressed={active.id===path.id} onclick={() => selected=path.id}>{#if !isEngineering}<span class="stage-number">{i+1}</span>{/if}{path.title}</button>{/each}
        </div>
        <noscript><p>All proposed approaches are available in the outline below.</p></noscript>
      </div>
      <div class="plan-preview" aria-live="polite" aria-atomic="true">
        <p class="preview-label">Illustrative content preview</p><h3>{active.question}</h3><p>{active.body}</p><blockquote>{active.example}</blockquote><p class="proposed-resource">{active.next}</p>
        <a href="#outline">See the complete proposed outline ↓</a>
      </div>
    </section>
    <section class="plan-outline" id="outline" aria-labelledby="outline-heading">
      <div><h2 id="outline-heading">{isEngineering?'A small, useful resource library.':'Make the next conversation easier.'}</h2><p>{isEngineering?'The first proposed collection would favor worked examples over long introductions.':'A compact outline could help people prepare for a conversation without implying a completed review.'}</p></div>
      <div class="outline-list">{#each paths as path (path.id)}<details><summary>{path.title}<span aria-hidden="true">+</span></summary><p>{path.body}</p><p><strong>{path.next}</strong></p><p class="placeholder-line">Placeholder only. This resource has not been authored.</p></details>{/each}</div>
    </section>
    <section class="plan-discussion" aria-labelledby="discussion-heading">
      <div><h2 id="discussion-heading">What should we build next?</h2><p>Mark the ideas you would want to discuss. This is a local interaction demo; nothing is saved or sent.</p></div>
      <div><fieldset><legend>Ideas to discuss</legend>{#each paths as path (path.id)}<label><input type="checkbox" value={path.id} bind:group={marked}/>{path.next.replace('Proposed resource: ','').replace(/\.$/,'')}</label>{/each}</fieldset><p class="selection-status" role="status">{marked.length} of {paths.length} ideas marked for discussion</p><button class="reset-ideas" onclick={() => marked=[]} disabled={!marked.length}>Clear choices</button></div>
    </section>
    <section class="official-exit" aria-labelledby="official-heading"><h2 id="official-heading">Looking for official guidance?</h2><p>Use the published FedRAMP sources for requirements and program guidance.</p><nav aria-label="Official resources">{#if isEngineering}<a href="https://www.fedramp.gov/2026/providers/20x/key-security-indicators/">Key Security Indicators ↗</a><a href="https://www.fedramp.gov/2026/">Consolidated rules and guidance ↗</a>{:else}<a href="https://www.fedramp.gov/2026/agencies/use/">Agency guidance ↗</a><a href="https://www.fedramp.gov/2026/agencies/rules/agency-use/">Agency use rules ↗</a>{/if}</nav></section>
  </main>
  <footer class="plan-footer"><p>Iteration 13 · Open House<br/>Basic prototyping for interactive planning.</p><a href={base+'/'}>Homepage</a><a href={base+'/community/'}>Community Hub</a><a href="#top">Back to top ↑</a></footer>
</div>
