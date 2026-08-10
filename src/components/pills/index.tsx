// Pill registry — single source of truth for all dynamic pills
import React from 'react';
import { WeatherPill, weatherPillMeta } from './WeatherPill';
import { SportsPill, sportsPillMeta } from './SportsPill';
import { FlightPill, flightPillMeta } from './FlightPill';
import { StocksPill, stocksPillMeta } from './StocksPill';
import { TimerPill, timerPillMeta } from './TimerPill';
import { RecordingPill, recordingPillMeta } from './RecordingPill';
import { MusicPill, musicPillMeta } from './MusicPill';
import { DirectionsPill, directionsPillMeta } from './DirectionsPill';
import { NotificationPill, notificationPillMeta } from './NotificationPill';
import { ClockPill, clockPillMeta } from './ClockPill';
import { ConnectivityPill, connectivityPillMeta } from './ConnectivityPill';
import { TasksPill, tasksPillMeta } from './TasksPill';
import { NewsPill, newsPillMeta } from './NewsPill';

import { CurrencyPill, currencyPillMeta } from './CurrencyPill';
import { CalculatorPill, calculatorPillMeta } from './CalculatorPill';
import { SystemPill, systemPillMeta } from './SystemPill';
import { TranslationPill, translationPillMeta } from './TranslationPill';
import { CalendarPill, calendarPillMeta } from './CalendarPill';

export interface PillProps {
  data?: Record<string, unknown>;
  defaultExpanded?: boolean;
  onExpand?: (h: number) => void;
  [key: string]: unknown;
}

export interface PillEntry {
  name: string;
  height: number;
  keywords: string[];
  component: React.ComponentType<PillProps>;
}

export const PILL_REGISTRY: PillEntry[] = [
  { ...weatherPillMeta, component: WeatherPill },
  { ...sportsPillMeta, component: SportsPill },
  { ...flightPillMeta, component: FlightPill },
  { ...stocksPillMeta, component: StocksPill },
  { ...newsPillMeta, component: NewsPill },
  { ...timerPillMeta, component: TimerPill },
  { ...recordingPillMeta, component: RecordingPill },
  { ...musicPillMeta, component: MusicPill },
  { ...directionsPillMeta, component: DirectionsPill },
  { ...notificationPillMeta, component: NotificationPill },
  { ...clockPillMeta, component: ClockPill },
  { ...connectivityPillMeta, component: ConnectivityPill },
  { ...tasksPillMeta, component: TasksPill },
  { ...currencyPillMeta, component: CurrencyPill },
  { ...calculatorPillMeta, component: CalculatorPill },
  { ...systemPillMeta, component: SystemPill },
  { ...translationPillMeta, component: TranslationPill },
  { ...calendarPillMeta, component: CalendarPill },
];

export function findPillByQuery(query: string): number {
  const lower = query.toLowerCase();
  for (let i = 0; i < PILL_REGISTRY.length; i++) {
    for (const keyword of PILL_REGISTRY[i].keywords) {
      if (lower.includes(keyword)) return i;
    }
  }
  return -1;
}

// Re-export individual pills for use in MainApp
export { WeatherPill } from './WeatherPill';
export { SportsPill } from './SportsPill';
export { FlightPill } from './FlightPill';
export { StocksPill } from './StocksPill';
export { MusicPill } from './MusicPill';
export { NewsPill } from './NewsPill';
export { ConnectivityPill } from './ConnectivityPill';
export { CurrencyPill } from './CurrencyPill';
export { CalculatorPill } from './CalculatorPill';
export { SystemPill } from './SystemPill';
export { TranslationPill } from './TranslationPill';
export { CalendarPill } from './CalendarPill';
