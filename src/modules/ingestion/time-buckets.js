function startOfHour(date) {
  const value = new Date(date);
  value.setMinutes(0, 0, 0);
  return value;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthParts(date) {
  return { mes: date.getMonth() + 1, anio: date.getFullYear() };
}

module.exports = { startOfHour, startOfDay, monthParts };
