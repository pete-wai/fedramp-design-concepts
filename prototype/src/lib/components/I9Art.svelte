<script lang="ts">
  import { onMount } from 'svelte';
  let {kind,paused=false}=$props<{kind:string;paused?:boolean}>();
  let canvas=$state<HTMLCanvasElement>();
  let syncMotion:()=>void=()=>{};
  // Imperative rendering scheduler must respond to the Menu setting.
  $effect(()=>{void paused;syncMotion();});
  const paths=Array.from({length:22},(_,id)=>({id,d:`M-100 ${480+id*9} C240 ${220+id*7} 400 ${870-id*5} 780 ${570+id*5} S1220 ${200+id*11} 1540 ${550+id*5}`}));
  onMount(()=>{
    if(!canvas)return;
    const element=canvas,ctx=element.getContext('2d');if(!ctx)return;
    let frame=0,width=1,height=1,time=0,last=0,visible=true;
    const mq=matchMedia('(prefers-reduced-motion: reduce)');
    const index=['pulse','cadence','undertow','confluence','resonance','groundwire','uplink','contour','fieldnotes','common-ground'].indexOf(kind);
    const terrain=index>=5, network=[3,5,6,8,9].includes(index), heartbeat=[0,1,4,9].includes(index);
    const cycle=[1.35,1.8,9,7,1.6,6,5,12,8,1.5][index]||6;
    let colors=['#8250d7','#df6723','#2e9cac'];
    function draw(){
      if(!ctx)return;ctx.clearRect(0,0,width,height);
      const phase=time/cycle*Math.PI*2;
      const count=kind==='fieldnotes'?20:kind==='undertow'?54:36;
      for(let j=0;j<count;j++){
        ctx.beginPath();ctx.strokeStyle=colors[(j+index)%3];ctx.lineWidth=j%7===0?1.35:.65;ctx.globalAlpha=network?.3:.52;
        for(let x=-8;x<=width+8;x+=6){
          const t=x/width,edge=Math.pow(Math.abs(t-.5)*2,1.65);
          let y=terrain?height*(.72+j*.007)+Math.sin(t*9+time*.13+j*.13)*height*.068+Math.sin(t*16-j*.08)*height*.025:height*(.79-.5*edge)+Math.sin(t*(6+index)+time*.18+j*.07)*height*.08+j*2.25;
          if(heartbeat){const travel=((time/cycle)%1)*1.6-.3;const beat=Math.exp(-Math.pow((t-travel)*13,2))-.48*Math.exp(-Math.pow((t-travel+.045)*23,2));y-=beat*height*(kind==='resonance'?.075:.043)*Math.sin(j*.19+1);}
          if(kind==='confluence')y+=Math.sin(t*13-time*.3+j*.07)*height*.045;
          x===-8?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }ctx.stroke();
      }
      if(network){
        const count=width<600?7:13;
        for(let j=0;j<count;j++){
          const age=(time/(kind==='common-ground'?1.5:4.5)+j*.618)%1;
          const alpha=Math.pow(Math.sin(age*Math.PI),2)*.65;
          const x=width*((j*.6180339+.07)%1),endX=x+Math.sin(j*7.4)*width*.11;
          // Keep the central headline quiet; networks live on the outer banks.
          const side=x<width*.5?Math.min(x,width*.22):Math.max(x,width*.78);
          const top=height*(.22+(j%4)*.09),bottom=height*(.83+(j%3)*.04);
          ctx.globalAlpha=alpha;ctx.strokeStyle=colors[j%3];ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(side,top);ctx.bezierCurveTo(side+width*.09,top+height*.14,endX-width*.05,bottom-height*.13,endX,bottom);ctx.stroke();
          const u=kind==='uplink'?1-age:age,v=1-u;
          const px=v*v*v*side+3*v*v*u*(side+width*.09)+3*v*u*u*(endX-width*.05)+u*u*u*endX;
          const py=v*v*v*top+3*v*v*u*(top+height*.14)+3*v*u*u*(bottom-height*.13)+u*u*u*bottom;
          ctx.fillStyle=colors[j%3];ctx.beginPath();ctx.arc(px,py,2.3,0,Math.PI*2);ctx.fill();
          for(const [nx,ny] of [[side,top],[endX,bottom]]){ctx.beginPath();ctx.arc(nx,ny,3,0,Math.PI*2);ctx.stroke();}
        }
      }
      ctx.globalAlpha=1;
    }
    function loop(now:number){frame=0;if(paused||mq.matches||!visible||document.hidden)return;if(now-last>=32){time+=Math.min((now-last)/1000,.06);last=now;draw();}frame=requestAnimationFrame(loop);}
    syncMotion=()=>{cancelAnimationFrame(frame);frame=0;last=performance.now();element.dataset.moving=String(!paused&&!mq.matches&&visible&&!document.hidden);if(!paused&&!mq.matches&&visible&&!document.hidden)frame=requestAnimationFrame(loop);};
    function resize(){const r=element.getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio,1.5);element.width=Math.round(width*d);element.height=Math.round(height*d);ctx?.setTransform(d,0,0,d,0,0);draw();}
    function colorsChanged(){const s=getComputedStyle(element);colors=['--art-purple','--art-orange','--art-blue'].map(k=>s.getPropertyValue(k).trim());draw();}
    const ro=new ResizeObserver(resize);ro.observe(element);
    const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();});io.observe(element);
    const mo=new MutationObserver(colorsChanged);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    mq.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);colorsChanged();resize();syncMotion();
    return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();mo.disconnect();mq.removeEventListener('change',syncMotion);document.removeEventListener('visibilitychange',syncMotion);syncMotion=()=>{};};
  });
</script>
<div class="art art-{kind}" aria-hidden="true"><svg class="art-fallback" viewBox="0 0 1440 900" preserveAspectRatio="none">{#each paths as p(p.id)}<path d={p.d} fill="none" stroke="currentColor" stroke-width="1"/>{/each}</svg><canvas bind:this={canvas}></canvas></div>
