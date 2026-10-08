<script lang="ts">
  import { onMount } from 'svelte';
  let { kind } = $props<{kind:string}>();
  let ready=$state(false), visible=$state(false), active=$state('top'), progress=$state(0);
  let chooser=$state<HTMLDetailsElement>();
  let scheduled=0;
  function update(){
    scheduled=0;
    const hero=document.querySelector('.hero');
    const providers=document.getElementById('providers');
    const agencies=document.getElementById('agencies');
    visible=!!hero && hero.getBoundingClientRect().bottom<100;
    active=agencies && agencies.getBoundingClientRect().top<innerHeight*.4?'agencies':providers && providers.getBoundingClientRect().top<innerHeight*.4?'providers':'top';
    const menu=document.querySelector<HTMLElement>('.scroll-nav');
    if(menu){const bounds=menu.getBoundingClientRect();document.querySelector<HTMLElement>('.i9')?.style.setProperty('--nav-offset',(bounds.top<150?bounds.height+24:24)+'px');}
    progress=Math.max(0,Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
  }
  function schedule(){if(!scheduled)scheduled=requestAnimationFrame(update);}
  function jump(event:MouseEvent){
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=(event.target as Element).closest('a');
    if(!link)return;
    const id=link.hash.slice(1), target=document.getElementById(id);
    if(chooser)chooser.open=false;
    target?.focus({preventScroll:true});
  }
  function escape(event:KeyboardEvent){if(event.key==='Escape'&&chooser?.open){chooser.open=false;chooser.querySelector('summary')?.focus();}}
  onMount(()=>{
    ready=true;update();
    const observer=new ResizeObserver(schedule), menu=document.querySelector('.scroll-nav');
    if(menu)observer.observe(menu);
    const initialHash=location.hash;
    let disposed=false,interacted=false,alignmentFrame=0;
    const interrupted=()=>{interacted=true;};
    for(const event of ['wheel','touchstart','keydown'])window.addEventListener(event,interrupted,{passive:true});
    // Native hash restoration may precede hydration/font layout in Firefox and WebKit.
    // Align once after enhancement, without overriding a visitor's intervening input.
    document.fonts.ready.then(()=>{
      if(disposed||interacted||!['#providers','#agencies','#sponsorship'].includes(initialHash))return;
      alignmentFrame=requestAnimationFrame(()=>{
        update();
        alignmentFrame=requestAnimationFrame(()=>{
          if(disposed||interacted||location.hash!==initialHash)return;
          document.getElementById(initialHash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'});
          update();
        });
      });
    });
    return()=>{disposed=true;cancelAnimationFrame(scheduled);cancelAnimationFrame(alignmentFrame);observer.disconnect();for(const event of ['wheel','touchstart','keydown'])window.removeEventListener(event,interrupted);};
  });
</script>
<svelte:window onscroll={schedule} onresize={schedule} onkeydown={escape}/>
<nav class="scroll-nav nav-{kind}" class:enhanced={ready} class:shown={visible} aria-label="On this page" style:--read={`${progress*100}%`} data-active={active}>
  {#if kind==='uplink'}
    <a class="top-link" href="#top" onclick={jump}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v15"/></svg><span>Top</span></a>
    <details bind:this={chooser} class="destination-chooser"><summary>{active==='providers'?'Providers':active==='agencies'?'Agencies':'Explore'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="destination-options"><a href="#providers" onclick={jump} aria-current={active==='providers'?'location':undefined}>Providers</a><a href="#agencies" onclick={jump} aria-current={active==='agencies'?'location':undefined}>Agencies</a></div></details>
  {:else}
    <a class="top-link" href="#top" onclick={jump}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v15"/></svg><span>Top</span></a>
    <div class="audience-destinations"><a href="#providers" onclick={jump} aria-current={active==='providers'?'location':undefined}>Providers</a><a href="#agencies" onclick={jump} aria-current={active==='agencies'?'location':undefined}>Agencies</a></div>
  {/if}
</nav>
