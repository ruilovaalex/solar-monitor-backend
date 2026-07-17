function mapHttpDeviceRequest(req) {
  const authorization = req.header("authorization");
  const [, authorizationKey] = authorization?.match(/^(?:Bearer|Device)\s+(.+)$/i) || [];

  return {
    protocol: "HTTP_REST",
    deviceId: req.params.deviceId,
    deviceKey: req.header("x-device-key") || authorizationKey,
    payload: req.body,
    ip: req.ip,
  };
}

module.exports = { mapHttpDeviceRequest };
