const app = require("./app");
const { port } = require("./config/env");

app.listen(port, () => {
  console.log(`Ferio backend escuchando en http://localhost:${port}`);
});
