const test = require("node:test");
const assert = require("node:assert/strict");

test("la configuración de producción rechaza un JWT_SECRET ausente o corto", () => {
  const previousEnvironment = process.env.NODE_ENV;
  const previousSecret = process.env.JWT_SECRET;
  const configPath = require.resolve("../src/config/env");

  try {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "corta";
    delete require.cache[configPath];
    assert.throws(() => require("../src/config/env"), /JWT_SECRET/);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    delete require.cache[configPath];
  }
});

test("los administradores sólo proceden de ADMIN_EMAILS", () => {
  const previousAdmins = process.env.ADMIN_EMAILS;
  const envPath = require.resolve("../src/config/env");
  const repositoryPath = require.resolve("../src/models/userRepository");

  try {
    process.env.ADMIN_EMAILS = "seguridad@fullfragance.test";
    delete require.cache[envPath];
    delete require.cache[repositoryPath];
    const repository = require("../src/models/userRepository");
    assert.equal(repository.roleForEmail("admin@gmail.com"), "customer");
    assert.equal(repository.roleForEmail("seguridad@fullfragance.test"), "admin");
  } finally {
    if (previousAdmins === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previousAdmins;
    delete require.cache[envPath];
    delete require.cache[repositoryPath];
  }
});
