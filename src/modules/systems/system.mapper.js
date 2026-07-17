function toNumber(value) {
  return Number(value || 0);
}

function mapSystem(system) {
  const daily = system.resumenesDiarios?.[0];
  const monthly = system.resumenesMensuales?.[0];
  const realtime = system.datoTiempoReal;
  const capacityKw = toNumber(system.potenciaInstalada);
  const dailyProductionKwh = toNumber(daily?.energiaGeneradaTotal);
  const energyBalanceKwh = toNumber(realtime?.balanceEnergetico || daily?.balanceTotal);
  const efficiency = capacityKw > 0 ? Math.min(100, Number(((dailyProductionKwh / (capacityKw * 5)) * 100).toFixed(1))) : 0;

  return {
    id: system.id,
    name: system.nombreSistema,
    nombreSistema: system.nombreSistema,
    location: system.ubicacion,
    ubicacion: system.ubicacion,
    capacityKw,
    potenciaInstalada: capacityKw,
    panels: Math.max(Math.round(capacityKw / 0.4), 1),
    inverter: "Inversor simulado",
    status: realtime ? "online" : "offline",
    dailyProductionKwh,
    monthlyProductionKwh: toNumber(monthly?.energiaGeneradaTotal),
    efficiency,
    energyBalanceKwh,
    createdAt: system.createdAt,
    updatedAt: system.updatedAt,
  };
}

module.exports = { mapSystem };
