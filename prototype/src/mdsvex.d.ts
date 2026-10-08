declare module "*.svelte.md" { import type {Component} from "svelte"; const component: Component<any>; export default component; export const metadata: Record<string,any>; }
