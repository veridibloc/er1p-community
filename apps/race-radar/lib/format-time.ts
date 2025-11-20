
export const formatTime = (time: number) => `${Math.floor(time / 60)}:${time % 60 < 10 ? '0' : ''}${time % 60}`
