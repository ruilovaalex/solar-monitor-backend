function hasSignificantAverageChange({ average, previousAverage, threshold }) {
  if (average === null || average === undefined) return false;
  if (previousAverage === null || previousAverage === undefined) return false;
  return Math.abs(Number(average) - Number(previousAverage)) >= Number(threshold);
}

function buildStorageDecision({ lastStored, readingTimestamp, outOfRange, config, significantAverageChange }) {
  if (!lastStored) return { shouldStore: true, reason: "INITIAL" };
  if (outOfRange) return { shouldStore: true, reason: "OUT_OF_RANGE" };
  if (significantAverageChange) return { shouldStore: true, reason: "AVERAGE_CHANGE" };

  const intervalMs = config.intervaloGuardadoNormalMinutos * 60 * 1000;
  const dueByInterval = readingTimestamp.getTime() - lastStored.timestamp.getTime() >= intervalMs;

  if (dueByInterval) {
    return { shouldStore: true, reason: "REGULAR_INTERVAL" };
  }

  return { shouldStore: false, reason: "INTERVAL_NOT_REACHED" };
}

module.exports = { hasSignificantAverageChange, buildStorageDecision };
