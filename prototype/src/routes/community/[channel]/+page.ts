import {error} from '@sveltejs/kit';
import {channels} from '$lib/community/channels';
export function entries(){return channels.map(c=>({channel:c.id}));}
export function load({params}){if(!channels.some(c=>c.id===params.channel))error(404,'Source not found');return {channel:params.channel};}
