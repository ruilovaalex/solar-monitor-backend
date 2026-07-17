function mapReadingDetails(reading) {
  if (!reading) return null;

  return {
    timestamp: reading.fechaLectura ?? null,
    dataSource: typeof reading.fuenteDatos === "string" ? reading.fuenteDatos.toLowerCase() : null,
    outOfRange: Boolean(reading.fueraRango),
    voltage: reading.voltaje === null || reading.voltaje === undefined ? 0 : Number(reading.voltaje),
    current: reading.corriente === null || reading.corriente === undefined ? 0 : Number(reading.corriente),
    power: reading.potencia === null || reading.potencia === undefined ? 0 : Number(reading.potencia),
  };
}

function mapDevice(device) {
  const readings = Array.isArray(device.ultimaLecturas) ? device.ultimaLecturas : [];
  const fallbackReading = device.ultimaLectura ?? null;
  const allReadings = [...readings];

  if (fallbackReading) {
    allReadings.push(fallbackReading);
  }

  const latestReading = allReadings
    .filter((item) => item?.fechaLectura instanceof Date)
    .sort((left, right) => right.fechaLectura.getTime() - left.fechaLectura.getTime())[0]
    ?? readings[0]
    ?? fallbackReading;
  const generationReading = allReadings.find((item) => item?.fuenteDatos === "GENERATION") ?? null;
  const consumptionReading = allReadings.find((item) => item?.fuenteDatos === "CONSUMPTION") ?? null;
  const toleranceMs = Math.max(device.intervaloMuestreoSegundos * 3, 30) * 1000;
  const isOnline = device.ultimoContacto
    ? Date.now() - device.ultimoContacto.getTime() <= toleranceMs
    : false;
  const hasOutOfRange = readings.some((item) => item.fueraRango);
  const status = hasOutOfRange ? "attention" : isOnline ? "online" : "offline";

  return {
    id: device.id,
    name: device.nombre,
    type: device.tipo.toLowerCase(),
    model: device.modelo,
    dataSource: device.fuenteDatos.toLowerCase(),
    status,
    lastSeen: device.ultimoContacto,
    sampleIntervalSeconds: device.intervaloMuestreoSegundos,
    ultimaLectura: mapReadingDetails(latestReading),
    ultimaGeneracion: mapReadingDetails(generationReading),
    ultimoConsumo: mapReadingDetails(consumptionReading),
    readings: {
      voltage: latestReading?.voltaje === null || latestReading?.voltaje === undefined ? 0 : Number(latestReading.voltaje),
      current: latestReading?.corriente === null || latestReading?.corriente === undefined ? 0 : Number(latestReading.corriente),
      power: latestReading?.potencia === null || latestReading?.potencia === undefined ? 0 : Number(latestReading.potencia),
      generationPower: generationReading?.potencia === null || generationReading?.potencia === undefined ? 0 : Number(generationReading.potencia),
      consumptionPower: consumptionReading?.potencia === null || consumptionReading?.potencia === undefined ? 0 : Number(consumptionReading.potencia),
      generationVoltage: generationReading?.voltaje === null || generationReading?.voltaje === undefined ? 0 : Number(generationReading.voltaje),
      consumptionVoltage: consumptionReading?.voltaje === null || consumptionReading?.voltaje === undefined ? 0 : Number(consumptionReading.voltaje),
    },
  };
}

module.exports = { mapDevice };
