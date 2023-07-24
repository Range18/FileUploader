export const getTimeMultByChar = (timeTypeChar: string): number => {
  return timeTypeChar == 'min' ||
    timeTypeChar == 'minutes' ||
    timeTypeChar == 'minute'
    ? 60 * 1000
    : timeTypeChar == 'h' || timeTypeChar == 'hours' || timeTypeChar == 'hour'
    ? 60 * 60 * 1000
    : timeTypeChar == 'd' || timeTypeChar == 'days' || timeTypeChar == 'day'
    ? 24 * 60 * 60 * 1000
    : timeTypeChar == 'month'
    ? 28 * 24 * 60 * 60 * 1000
    : -1;
};
