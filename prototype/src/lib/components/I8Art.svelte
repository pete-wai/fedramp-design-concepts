<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  let { kind, paused = false } = $props<{kind:string;paused?:boolean}>();
  let canvas = $state<HTMLCanvasElement>();
  let syncMotion:()=>void=()=>{};
  $effect(()=>{ void paused; syncMotion(); });
  const raster = ['atmosphere','fabric','civic-mosaic','panorama'];
  const paths = Array.from({length:28},(_,i)=>({id:i,d:`M -100 ${470+i*9} C 220 ${80+i*14}, 390 ${850-i*9}, 760 ${480+i*5} S 1190 ${130+i*12}, 1510 ${400+i*5}`}));
  onMount(() => {
    if(!canvas)return;const element:HTMLCanvasElement=canvas;
    const ctx=element.getContext('2d'); if(!ctx) return;
    let frame=0,width=1,height=1,visible=true,phase=0,last=0;
    const mq=matchMedia('(prefers-reduced-motion: reduce)');
    let colors=['#814ce7','#e27034','#438da9'];
    const colorsChanged=()=>{const styles=getComputedStyle(element);colors=[styles.getPropertyValue('--art-purple').trim(),styles.getPropertyValue('--art-orange').trim(),styles.getPropertyValue('--art-blue').trim()];draw();};
    function draw(){if(!ctx)return;ctx.clearRect(0,0,width,height);
      if(kind==='current'){
        for(let i=0;i<52;i++){ctx.beginPath();ctx.strokeStyle=colors[i%3];ctx.globalAlpha=.4+(i%7)*.055;ctx.lineWidth=i%8===0?1.5:.7;
          for(let x=-10;x<width+12;x+=8){const t=x/width;const edge=Math.pow(Math.abs(t-.5)*2,1.7);const y=height*(.83-.56*edge)+Math.sin(t*8+phase+i*.06)*height*.085+i*2.2; x===-10?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
      }else if(kind==='fieldwork'){
        for(let j=0;j<42;j++){ctx.beginPath();ctx.strokeStyle=colors[j%3];ctx.globalAlpha=.5;ctx.lineWidth=j%5===0?1.7:.65;
          for(let x=0;x<=width+6;x+=6){const t=x/width;const y=height*(.67+j*.009)+Math.sin(t*9+phase*.25+j*.11)*height*.095+Math.sin(t*17-j*.1)*height*.025; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
      }else{
        const points=Array.from({length:62},(_,i)=>({x:width*((Math.sin(i*127.1)*43758.5453)%1+1)%width,y:height*(.62+((Math.sin(i*311.7)*9375.2)%1+1)%1*.35)+Math.sin(phase+i)*4}));
        for(let i=0;i<points.length;i++){const a=points[i];ctx.strokeStyle=colors[i%3];for(let j=i+1;j<points.length;j++){const b=points[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<width*.12){ctx.globalAlpha=(1-d/(width*.12))*.8;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}ctx.globalAlpha=.8;ctx.fillStyle=colors[i%3];ctx.beginPath();ctx.arc(a.x,a.y,i%6===0?4:1.6,0,Math.PI*2);ctx.fill();}
      }ctx.globalAlpha=1;
    }
    function loop(time:number){frame=0;if(paused||mq.matches||!visible||document.hidden)return;if(time-last>40){phase+=.009;draw();last=time;}frame=requestAnimationFrame(loop);}
    syncMotion=()=>{cancelAnimationFrame(frame);frame=0;if(!paused&&!mq.matches&&visible&&!document.hidden)frame=requestAnimationFrame(loop);};
    mq.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);
    function resize(){const r=element.getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio,1.5);element.width=Math.round(width*d);element.height=Math.round(height*d);ctx?.setTransform(d,0,0,d,0,0);draw();}
    const ro=new ResizeObserver(resize);ro.observe(element);
    const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();});io.observe(element);
    const mo=new MutationObserver(colorsChanged);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});colorsChanged();resize();syncMotion();
    return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();mo.disconnect();mq.removeEventListener('change',syncMotion);document.removeEventListener('visibilitychange',syncMotion);syncMotion=()=>{};};
  });
</script>
<div class="art art-{kind}" aria-hidden="true" class:paused>
  {#if raster.includes(kind)}
    <img class="hero-art-image" src={base+'/i8/'+kind+'.jpg'} alt="" width="1916" height="821" fetchpriority="high" />
  {:else if ['current','fieldwork','constellation'].includes(kind)}
    <svg class="art-fallback" viewBox="0 0 1440 900" preserveAspectRatio="none">{#each paths as p(p.id)}<path d={p.d} fill="none" stroke="currentColor" stroke-width="1"/>{/each}</svg>
    <canvas bind:this={canvas}></canvas>
  {:else if kind==='prism'}
    <div class="plane plane-one"></div><div class="plane plane-two"></div><div class="plane plane-three"></div><div class="plane plane-four"></div>
  {:else if kind==='momentum'}
    <div class="type-landscape"><span>20</span><span>×</span></div><div class="type-rule"></div>
  {:else if kind==='relay'}
    <svg class="relay-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke-width="2"><path d="M-40 750H200Q260 750 260 690V590Q260 530 320 530H610Q670 530 670 590V670Q670 730 730 730H990Q1050 730 1050 670V590Q1050 530 1110 530H1480"/><path d="M-40 610H150Q210 610 210 670V740Q210 800 270 800H620Q680 800 680 740V650Q680 590 740 590H1010Q1070 590 1070 650V730Q1070 790 1130 790H1480"/></g><g class="relay-nodes"><rect x="200" y="590" width="110" height="85" rx="16"/><rect x="650" y="650" width="110" height="85" rx="16"/><rect x="1050" y="560" width="110" height="85" rx="16"/></g><g class="relay-symbols"><path d="M240 615l-13 17 13 17m30-34 13 17-13 17M691 681l10 10 19-22M1080 587h50m-50 12h35m-35 12h43"/></g></svg>
  {/if}
</div>
