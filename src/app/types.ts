export type ActiveCallSheetTimer = {
  matchStartTime: string
  activeItem: CallSheetItem
  nextItem?: CallSheetItem
  itemTimer: ItemTimer
}

export type ItemTimer = {
  timerValue: string
  timerColor: string
  startTimestamp: string
  endTimestamp: string
}

export type CallSheetItem = {
  id: number
  timeStart: string
  durationInMinutes: number
  timeEnd: string
  title: string
}

export type CallSheet = {
  matchInfo: MatchInfo
  schedule: Schedule
}

export type MatchInfo = {
  league: string
  title: string
  date: string
  startTime: string
}

export type Schedule = {
  items: ScheduleItem[]
}

export type ScheduleItem = {
  id: number
  timeStart: string
  durationInMinutes: number
  timeEnd: string
  title: string
}

export type ActiveCallSheet = {
  activeCallSheetFile: string
  itemStartedTimestamp: string
  itemDeadlineTimestamp?: string | null
  callSheetActivationTimestamp: string
  activeItem: number
  callSheet: CallSheet
}
export type CallSheetInfo = {
  matchDate: string
  matchTime: string
  league: string
  matchTitle: string
  fileName: string
}
