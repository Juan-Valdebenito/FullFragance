const { getStoresForCity } = require("../models/storeService");

async function listStores(req, res, next) {
  try {
    const { cityName, lat, lon } = req.query;
    if (!cityName || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Se requiere cityName, lat y lon." });
    }
    const stores = await getStoresForCity({ cityName, lat, lon });
    res.json({ stores });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStores };
