/* lib/types/changelog.ts */
export interface EntryLink {
  name: string;
  link?: string;
  'change-info'?: string;
}

export interface Entry {
  id: number;
  date: string;
  details: string;
  links: EntryLink[];
  tag?: string;
}

export interface Changelog {
  title?: string;
  entries: Entry[];
}
