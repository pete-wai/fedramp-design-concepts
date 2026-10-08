/* lib/types/timeline.ts */
export interface TimelineStage {
  name: string;
  date: Date | null;
  status: 'finished' | 'ongoing' | 'cancelled' | 'planned';
}
