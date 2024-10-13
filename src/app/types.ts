export type ActiveCallSheetTimer = {
  matchStartTime: string
  activeItem?: CallSheetItem | null
  nextItem?: CallSheetItem | null
  itemTimer: ItemTimer
}

export type VMixLiveStreamTimer = {
  matchStartTime?: string | null
  timerValue: string
  timerColor?: string | null
  timerStart?: string | null
  timerEnd?: string | null
  timerText: string | '-'
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
  homeClub: string
  awayClub: string
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
  description?: string | null
  vMixId?: string | null
  vMixTitle?: string | null
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

export type TimerRequest = {
  durationInSeconds: number
  timerDescription: string
  callSheetIdentifier?: string | null
  startTimeStamp: string
}

export type Role = {
  code: string
  displayName: string
  personName: string
}

export type StreamFunction = {
  FUNCTION: string
  NAME: string
}
