import {error} from '@sveltejs/kit';
import snapshot from '$lib/community/data.json';
export function entries(){return snapshot.items.map(x=>({channel:x.channel,slug:x.slug}));}
export function load({params}){const item=snapshot.items.find(x=>x.channel===params.channel&&x.slug===params.slug);if(!item)error(404,'Update not found');return {item};}
