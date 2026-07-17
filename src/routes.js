const { Router } = require("express");
const { env } = require("./config/env");
const { authorize } = require("./shared/middlewares/rbac");
const { userRoutes } = require("./modules/users/user.routes");
const { realtimeRoutes } = require("./modules/realtime/realtime.routes");
const { historyRoutes } = require("./modules/history/history.routes");
const { dashboardRoutes } = require("./modules/dashboard/dashboard.routes");
const { statsRoutes, statisticsController } = require("./modules/stats/stats.routes");
const { ingestionRoutes } = require("./modules/ingestion/ingestion.routes");
const { rbacRoutes } = require("./modules/rbac/rbac.routes");
const { authRoutes } = require("./modules/auth/auth.routes");
const { deviceRoutes } = require("./modules/devices/device.routes");
const { monitoringRoutes } = require("./modules/monitoring/monitoring.routes");

function buildRoutes() {
  const router = Router();

  router.get("/health", (req, res) => {
    res.json({ status: "ok", service: "solar-monitor-backend" });
  });

  router.use("/auth", authRoutes);
  router.use("/users", userRoutes);
  router.use("/devices", deviceRoutes);
  router.use("/monitoring", monitoringRoutes);
  router.use("/realtime", realtimeRoutes);
  router.use("/history", historyRoutes);
  router.use("/dashboard", dashboardRoutes);
  router.get("/statistics", authorize("stats:read"), statisticsController.frontend);
  router.use("/ingestion", ingestionRoutes);
  router.use("/rbac", rbacRoutes);

  if (env.legacyApiEnabled) {
    const { systemRoutes } = require("./modules/systems/system.routes");
    const { comparisonsRoutes } = require("./modules/comparisons/comparisons.routes");
    router.use("/systems", systemRoutes);
    router.use("/stats", statsRoutes);
    router.use("/comparisons", comparisonsRoutes);
  }

  return router;
}

module.exports = { buildRoutes };
