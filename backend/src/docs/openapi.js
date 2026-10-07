const bearerAuth = [{ bearerAuth: [] }];

const errorResponses = {
  400: {
    description: "Solicitud invalida",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  401: {
    description: "Token ausente o invalido",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  404: {
    description: "Recurso no encontrado",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
};

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "FullFragance API",
    version: "1.0.0",
    description:
      "API para autenticacion, catalogo, recomendaciones, favoritos, tiendas cercanas, precios y sincronizacion de scrapers.",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Servidor local",
    },
  ],
  tags: [
    { name: "Estado" },
    { name: "Auth" },
    { name: "Catalogo" },
    { name: "Precios" },
    { name: "Usuarios" },
    { name: "Tiendas" },
    { name: "Scrapers" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Estado"],
        summary: "Estado de la API",
        responses: {
          200: {
            description: "API disponible",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiStatus" },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar un usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Sesion iniciada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Obtener el usuario autenticado",
        security: bearerAuth,
        responses: {
          200: {
            description: "Usuario autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/catalog/notes": {
      get: {
        tags: ["Catalogo"],
        summary: "Listar notas olfativas",
        security: bearerAuth,
        responses: {
          200: {
            description: "Notas olfativas disponibles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notes: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScentNote" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/products": {
      get: {
        tags: ["Precios"],
        summary: "Listar productos del catalogo (paginado)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
        ],
        responses: {
          200: {
            description: "Una pagina de productos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/catalog/search": {
      get: {
        tags: ["Precios"],
        summary: "Buscar en el catalogo con filtros, orden y paginacion",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Busqueda por nombre o marca." },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "cat", in: "query", schema: { type: "string" } },
          { name: "gender", in: "query", schema: { type: "string", enum: ["Masculino", "Femenino", "Unisex"] } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "store", in: "query", schema: { type: "string" } },
          { name: "presentation", in: "query", schema: { type: "string", enum: ["individual", "set"] } },
          { name: "comparison", in: "query", schema: { type: "string", enum: ["multiple"] } },
          { name: "segment", in: "query", schema: { type: "string", enum: ["designer", "niche", "arabic"] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["recommended", "price", "price-desc", "savings", "stores", "name", "name-desc"] } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 48, default: 12 } },
        ],
        responses: {
          200: {
            description: "Pagina de resultados y opciones de filtros",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/ComparisonItem" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                    totalPages: { type: "integer" },
                    facets: {
                      type: "object",
                      properties: {
                        brands: { type: "array", items: { type: "string" } },
                        categories: { type: "array", items: { type: "string" } },
                        stores: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/catalog/ids": {
      get: {
        tags: ["Precios"],
        summary: "Ids de todos los perfumes (para el sitemap)",
        parameters: [
          { name: "minStores", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 20, default: 1 }, description: "Sólo perfumes presentes en al menos esta cantidad de tiendas." },
        ],
        responses: {
          200: {
            description: "Lista de ids",
            content: { "application/json": { schema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } } } } },
          },
          ...errorResponses,
        },
      },
    },
    "/catalog/stats": {
      get: {
        tags: ["Precios"],
        summary: "Conteo de perfumes, comparables y tiendas del catálogo vigente",
        responses: {
          200: {
            description: "Cifras del catálogo",
            content: { "application/json": { schema: { type: "object", properties: { products: { type: "integer" }, comparable: { type: "integer" }, stores: { type: "array", items: { type: "string" } } } } } },
          },
          ...errorResponses,
        },
      },
    },
    "/prices": {
      get: {
        tags: ["Precios"],
        summary: "Comparar precios online",
        description: "Con `ids` devuelve esos perfumes (favoritos). Con `q` devuelve hasta 100 resultados. Sin parametros devuelve el catalogo completo y requiere rol admin.",
        security: bearerAuth,
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Busqueda por nombre o marca (maximo 100 resultados).",
          },
          {
            name: "ids",
            in: "query",
            schema: { type: "string" },
            description: "Ids separados por coma (maximo 200).",
          },
        ],
        responses: {
          200: {
            description: "Comparacion de precios",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    comparison: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ComparisonItem" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/prices/{productId}": {
      get: {
        tags: ["Precios"],
        summary: "Comparar precios de un perfume",
        security: bearerAuth,
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Detalle del perfume con precios",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductPriceDetail" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/users/me/favorites": {
      get: {
        tags: ["Usuarios"],
        summary: "Listar favoritos del usuario",
        security: bearerAuth,
        responses: {
          200: {
            description: "Favoritos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    favorites: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/users/me/favorites/{productId}": {
      post: {
        tags: ["Usuarios"],
        summary: "Agregar o quitar favorito",
        security: bearerAuth,
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Favorito actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FavoriteResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/users/me/scent-quiz": {
      post: {
        tags: ["Usuarios"],
        summary: "Guardar respuestas del test olfativo",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ScentQuizRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Respuestas guardadas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScentQuizResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/users/me/recommendations": {
      get: {
        tags: ["Usuarios"],
        summary: "Obtener recomendaciones personalizadas",
        security: bearerAuth,
        responses: {
          200: {
            description: "Recomendaciones",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Recommendation" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/falabella/products": {
      get: {
        tags: ["Scrapers"],
        summary: "Listar productos sincronizados desde Falabella",
        security: bearerAuth,
        responses: {
          200: {
            description: "Productos de Falabella",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScrapedProduct" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/falabella/sync": {
      post: {
        tags: ["Scrapers"],
        summary: "Sincronizar URLs especificas de Falabella",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUrlSyncRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado de sincronizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScraperSyncResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/falabella/sync-perfumes": {
      post: {
        tags: ["Scrapers"],
        summary: "Buscar y sincronizar perfumes desde Falabella",
        security: bearerAuth,
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FalabellaPerfumeSyncRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado de sincronizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScraperSyncResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/ripley/products": {
      get: {
        tags: ["Scrapers"],
        summary: "Listar productos sincronizados desde Ripley",
        security: bearerAuth,
        responses: {
          200: {
            description: "Productos de Ripley",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScrapedProduct" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/ripley/sync": {
      post: {
        tags: ["Scrapers"],
        summary: "Sincronizar URLs especificas de Ripley",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUrlSyncRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado de sincronizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScraperSyncResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/ripley/sync-perfumes": {
      post: {
        tags: ["Scrapers"],
        summary: "Buscar y sincronizar perfumes desde Ripley",
        security: bearerAuth,
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FalabellaPerfumeSyncRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado de sincronizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScraperSyncResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/cosmetic/products": {
      get: {
        tags: ["Scrapers"],
        summary: "Listar productos sincronizados desde Cosmetic",
        security: bearerAuth,
        responses: {
          200: {
            description: "Productos de Cosmetic",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScrapedProduct" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/cosmetic/sync": {
      post: {
        tags: ["Scrapers"],
        summary: "Sincronizar URLs especificas de Cosmetic",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUrlSyncRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado de sincronizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScraperSyncResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/scrapers/cosmetic/sync-perfumes": {
      post: {
        tags: ["Scrapers"],
        summary: "Buscar y sincronizar perfumes desde Cosmetic",
        security: bearerAuth,
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FalabellaPerfumeSyncRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado de sincronizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScraperSyncResponse" },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiStatus: {
        type: "object",
        properties: {
          name: { type: "string", example: "FullFragance API" },
          status: { type: "string", example: "ok" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "No autorizado" },
          message: { type: "string" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Demo User" },
          email: { type: "string", format: "email", example: "demo@fullfragrance.test" },
          password: { type: "string", format: "password", minLength: 6, example: "secret123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "demo@fullfragrance.test" },
          password: { type: "string", format: "password", example: "secret123" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          favorites: {
            type: "array",
            items: { type: "string" },
          },
          scentPreferences: { $ref: "#/components/schemas/ScentPreferences" },
        },
      },
      ScentNote: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          family: { type: "string" },
          description: { type: "string" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          brand: { type: "string" },
          unit: { type: "string" },
          basePrice: { type: "number" },
          gender: { type: "string" },
          category: { type: "string" },
          imageUrl: { type: "string", format: "uri", nullable: true },
          source: { type: "string" },
          sourceUrl: { type: "string", format: "uri" },
          available: { type: "boolean" },
          priceIsMock: { type: "boolean" },
          description: { type: "string" },
          notes: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      ProductPriceDetail: {
        type: "object",
        properties: {
          product: { $ref: "#/components/schemas/Product" },
          prices: {
            type: "array",
            items: { $ref: "#/components/schemas/Price" },
          },
        },
      },
      ComparisonItem: {
        allOf: [
          { $ref: "#/components/schemas/ProductPriceDetail" },
          {
            type: "object",
            properties: {
              minPrice: { type: "number", nullable: true },
              maxPrice: { type: "number", nullable: true },
            },
          },
        ],
      },
      Price: {
        type: "object",
        properties: {
          storeId: { type: "string" },
          storeName: { type: "string" },
          price: { type: "number" },
          productUrl: { type: "string", format: "uri" },
          available: { type: "boolean" },
        },
      },
      FavoriteResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          favorites: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      ScentQuizRequest: {
        type: "object",
        required: ["scores"],
        properties: {
          scores: { $ref: "#/components/schemas/ScentScores" },
        },
      },
      ScentQuizResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          recommendations: {
            type: "array",
            items: { $ref: "#/components/schemas/Recommendation" },
          },
        },
      },
      ScentScores: {
        type: "object",
        additionalProperties: {
          type: "number",
          minimum: 1,
          maximum: 5,
        },
        example: { citrus: 5, vanilla: 4, oud: 2 },
      },
      ScentPreferences: {
        type: "object",
        nullable: true,
        properties: {
          scores: { $ref: "#/components/schemas/ScentScores" },
          completedAt: { type: "string", format: "date-time" },
        },
      },
      Recommendation: {
        type: "object",
        properties: {
          product: { $ref: "#/components/schemas/Product" },
          score: { type: "number", nullable: true },
          matchedNotes: {
            type: "array",
            items: { $ref: "#/components/schemas/ScentNote" },
          },
          reason: { type: "string" },
        },
      },
      ScrapedProduct: {
        type: "object",
        properties: {
          source: { type: "string", example: "ripley-cl" },
          sku: { type: "string" },
          name: { type: "string" },
          brand: { type: "string" },
          price: { type: "number" },
          currency: { type: "string", example: "CLP" },
          presentation: { type: "string" },
          imageUrl: { type: "string", format: "uri" },
          available: { type: "boolean" },
          url: { type: "string", format: "uri" },
          firstSeenAt: { type: "string", format: "date-time" },
          lastSeenAt: { type: "string", format: "date-time" },
        },
      },
      ProductUrlSyncRequest: {
        type: "object",
        required: ["productUrls"],
        properties: {
          productUrls: {
            type: "array",
            items: { type: "string", format: "uri" },
            example: ["https://simple.ripley.cl/perfume-dior-homme-hombre-edt-100-ml-2000378702900p"],
          },
        },
      },
      FalabellaPerfumeSyncRequest: {
        type: "object",
        properties: {
          maxProducts: {
            type: "integer",
            minimum: 1,
            maximum: 24,
            default: 12,
          },
        },
      },
      ScraperSyncResponse: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                ok: { type: "boolean" },
                product: { $ref: "#/components/schemas/ScrapedProduct" },
                warning: { type: "string" },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = openapi;
