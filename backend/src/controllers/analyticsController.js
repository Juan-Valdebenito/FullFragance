const analyticsRepository = require("../models/analyticsRepository");

function safePage(value) {
  const page = String(value || "/").trim();
  return page.startsWith("/") && page.length <= 160 ? page : "/";
}

async function trackPageView(req, res, next) {
  try {
    await analyticsRepository.recordPageView(safePage(req.body?.page));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getMetrics(_req, res, next) {
  try {
    res.json({ metrics: await analyticsRepository.getDashboardMetrics() });
  } catch (err) {
    next(err);
  }
}

async function setAdRevenue(req, res, next) {
  try {
    const revenue = Number(req.body?.revenue);
    if (!Number.isFinite(revenue) || revenue < 0 || revenue > 999999999) {
      return res.status(400).json({ error: "Ingresa un monto válido de ingresos publicitarios." });
    }
    await analyticsRepository.setReportedAdRevenue(revenue);
    res.json({ metrics: await analyticsRepository.getDashboardMetrics() });
  } catch (err) {
    next(err);
  }
}

module.exports = { trackPageView, getMetrics, setAdRevenue };
