import { type VMixLiveStreamTimer, type TimerRequest } from '../types'

class VMixService {
  setTimer = async (
    timerRequest: TimerRequest,
    timestamp: string,
  ): Promise<void> => {
    console.log('Set timer')
  }

  getTimer = async (): Promise<VMixLiveStreamTimer | null> => {
    return {
      timerValue: '',
      timerText: 'Timer received',
    } satisfies VMixLiveStreamTimer
  }
}

export default VMixService
