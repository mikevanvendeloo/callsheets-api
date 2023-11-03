export type ActiveCallSheetTimer = {
  matchStartTime: string;
  activeItem: CallSheetItem;
  nextItem?: CallSheetItem;
  itemTimer: ItemTimer;
}

export type ItemTimer = {
  timerValue: string;
  timerColor: string;
  startTimestamp: string;
  endTimestamp: string;
}

export type CallSheetItem = {
  id: number;
  timeStart: string;
  durationInMinutes: number;
  timeEnd: string;
  title: string;
}

type CallSheet = {
    matchInfo: MatchInfo;
    schedule: Schedule;
}
export default CallSheet

export type MatchInfo = {
    league: string;
    title: string;
    date: string;
    startTime: string;
}
  
export type Schedule = {
    items: ScheduleItem[];
}

export type ScheduleItem = {
    id: number;
    timeStart: string;
    durationInMinutes: number;
    timeEnd: string;
    title: string;
}
  
export type ActiveCallSheet = {
    activeCallSheet: string;
    itemStartTimestamp: string
    activationTimestamp: string;
    activeItem: number;
    callSheet: CallSheet;
}

// export type CallSheetResponse = {
//     matchInfo: MatchInfoResponse;
//     schedule: ScheduleResponse;
// }

// export type ActiveCallSheetResponse = {
//     activeCallSheet: string;
//     itemStartTimestamp: string
//     activationTimestamp: string;
//     activeItem: number;
//     callSheet: CallSheetResponse;
// }


// export type MatchInfoResponse = {
//     league: string;
//     title: string;
//     date: string;
//     startTime: string;
// }
  
// export type ScheduleResponse = {
//     items: ScheduleItemResponse[];
// }

// export type ScheduleItemResponse = {
//     id: number;
//     timeStart: string;
//     durationInMinutes: number;
//     timeEnd: string;
//     title: string;
// }