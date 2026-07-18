const catalogRepository = require("../models/catalogRepository");

function listNotes(_req, res, next) {
  try {
    res.json({ notes: catalogRepository.getOlfactoryNotes() });
  } catch (err) {
    next(err);
  }
}

function listProducts(_req, res, next) {
  try {
    res.json({ products: catalogRepository.getProducts() });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, listProducts };
