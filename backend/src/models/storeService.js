const { getChains } = require("./catalogRepository");
const { jitterPoint } = require("../utils/geo");

// En un sistema real esto vendría de una tabla "sucursales" con lat/lon reales
// cargadas por cada tienda. Por ahora generamos ubicaciones deterministas
// alrededor del centro de la ciudad para poder mostrar el mapa funcionando
// de punta a punta mientras se conecta una fuente de datos real.
function getStoresForCity({ cityName, lat, lon }) {
  const chains = getChains();
  return chains.map((chain) => {
    const point = jitterPoint(Number(lat), Number(lon), `${cityName}|${chain.id}`, 5);
    return {
      id: `${chain.id}-${cityName}`,
      chainId: chain.id,
      name: chain.name,
      address: `Sucursal ${chain.name}, ${cityName}`,
      lat: point.lat,
      lon: point.lon,
    };
  });
}

module.exports = { getStoresForCity };
