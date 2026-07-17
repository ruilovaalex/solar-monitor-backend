function parseDate(value, fieldName) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const { AppError } = require("../errors");
    throw new AppError(`${fieldName} no es una fecha valida`, 400);
  }
  return date;
}

function startOfDay(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function monthParts(date) {
  return { mes: date.getMonth() + 1, anio: date.getFullYear() };
}

module.exports = { parseDate, startOfDay, monthParts };
