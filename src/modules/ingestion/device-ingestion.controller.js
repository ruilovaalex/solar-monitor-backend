const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { mapHttpDeviceRequest } = require("./protocol-adapters/http-device.adapter");
const { auditEvent } = require("../../shared/audit");

class DeviceIngestionController {
  constructor(service) {
    this.ingest = asyncHandler(async (req, res) => {
      const result = await service.ingest(mapHttpDeviceRequest(req));
      await auditEvent({
        userId: null,
        action: "INGEST",
        table: "LecturasDispositivos",
        recordId: result.storage.rawReadingId,
        ip: req.ip,
        detail: {
          deviceId: result.deviceId,
          dataSource: result.dataSource,
          protocol: result.protocol,
          stored: result.storage.stored,
          outOfRange: result.analysis.outOfRange,
        },
      });
      res.status(202).json(result);
    });
  }
}

module.exports = { DeviceIngestionController };
