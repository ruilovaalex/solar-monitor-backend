class ComparisonsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getComparisons() {
    const [systems, deviceData] = await Promise.all([
      this.repository.findSystemsForComparison(),
      this.repository.findDeviceComparisonData(),
    ]);
    const items = systems.map((system) => {
      const daily = system.resumenesDiarios[0];
      const monthly = system.resumenesMensuales[0];
      const productionDailyKwh = Number(daily?.energiaGeneradaTotal || 0);
      const capacity = Number(system.potenciaInstalada || 1);
      const efficiency = capacity > 0 ? Math.min(100, Number(((productionDailyKwh / (capacity * 5)) * 100).toFixed(1))) : 0;

      return {
        systemId: system.id,
        systemName: system.nombreSistema,
        productionDailyKwh,
        productionMonthlyKwh: Number(monthly?.energiaGeneradaTotal || 0),
        efficiency,
        energyBalanceKwh: Number(daily?.balanceTotal || 0),
      };
    });

    const averageEfficiency = items.length
      ? Number((items.reduce((sum, item) => sum + item.efficiency, 0) / items.length).toFixed(1))
      : 0;
    const best = items.reduce((current, item) => (item.efficiency > current.efficiency ? item : current), {
      systemName: "",
      efficiency: -1,
    });

    return {
      benchmark: {
        averageEfficiency,
        bestSystemName: best.systemName,
        portfolioProductionKwh: Number(items.reduce((sum, item) => sum + item.productionMonthlyKwh, 0).toFixed(3)),
      },
      systems: items,
      devices: this.buildDeviceComparison(deviceData),
    };
  }

  buildDeviceComparison(deviceData) {
    const buildTotals = (rows) => {
      const generationPowerKw = rows
        .filter((item) => item.fuenteDatos === "GENERATION")
        .reduce((sum, item) => sum + (Number(item.promedioPotencia) * Number(item.muestras)), 0);
      const generationSamples = rows
        .filter((item) => item.fuenteDatos === "GENERATION")
        .reduce((sum, item) => sum + Number(item.muestras), 0);
      const consumptionPowerKw = rows
        .filter((item) => item.fuenteDatos === "CONSUMPTION")
        .reduce((sum, item) => sum + (Number(item.promedioPotencia) * Number(item.muestras)), 0);
      const consumptionSamples = rows
        .filter((item) => item.fuenteDatos === "CONSUMPTION")
        .reduce((sum, item) => sum + Number(item.muestras), 0);
      const generation = generationSamples ? generationPowerKw / generationSamples : 0;
      const consumption = consumptionSamples ? consumptionPowerKw / consumptionSamples : 0;

      return {
        generationPowerKw: Number(generation.toFixed(3)),
        consumptionPowerKw: Number(consumption.toFixed(3)),
        powerBalanceKw: Number((generation - consumption).toFixed(3)),
        comparisonAvailable: generationSamples > 0 && consumptionSamples > 0,
      };
    };

    return {
      today: buildTotals(deviceData.today),
      month: buildTotals(deviceData.month),
    };
  }
}

module.exports = { ComparisonsService };
