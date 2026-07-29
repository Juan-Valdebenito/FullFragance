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
    title: "FullFragrance API",
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
        summary: "Listar productos del catalogo",
        security: bearerAuth,
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Busqueda por nombre o marca.",
          },
        ],
        responses: {
          200: {
            description: "Productos disponibles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" },
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
    "/prices": {
      get: {
        tags: ["Precios"],
        summary: "Comparar precios por ciudad o ubicacion",
        security: bearerAuth,
        parameters: [
          { $ref: "#/components/parameters/CityName" },
          { $ref: "#/components/parameters/Latitude" },
          { $ref: "#/components/parameters/Longitude" },
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Busqueda por nombre o marca.",
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
          { $ref: "#/components/parameters/CityName" },
          { $ref: "#/components/parameters/Latitude" },
          { $ref: "#/components/parameters/Longitude" },
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
    "/users/me/city": {
      put: {
        tags: ["Usuarios"],
        summary: "Actualizar ciudad del usuario",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CityRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Ciudad actualizada",
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
    "/stores": {
      get: {
        tags: ["Tiendas"],
        summary: "Listar tiendas cercanas",
        security: bearerAuth,
        parameters: [
          { $ref: "#/components/parameters/CityName" },
          { $ref: "#/components/parameters/Latitude" },
          { $ref: "#/components/parameters/Longitude" },
        ],
        responses: {
          200: {
            description: "Tiendas disponibles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stores: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Store" },
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
    parameters: {
      CityName: {
        name: "cityName",
        in: "query",
        schema: { type: "string" },
        description: "Ciudad para ajustar tiendas y precios.",
      },
      Latitude: {
        name: "lat",
        in: "query",
        schema: { type: "number" },
        description: "Latitud para busqueda por cercania.",
      },
      Longitude: {
        name: "lon",
        in: "query",
        schema: { type: "number" },
        description: "Longitud para busqueda por cercania.",
      },
    },
    schemas: {
      ApiStatus: {
        type: "object",
        properties: {
          name: { type: "string", example: "FullFragrance API" },
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
          city: {
            type: "object",
            nullable: true,
            properties: {
              name: { type: "string" },
              country: { type: "string" },
              lat: { type: "number" },
              lon: { type: "number" },
            },
          },
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
      CityRequest: {
        type: "object",
        required: ["name", "lat", "lon"],
        properties: {
          name: { type: "string", example: "Santiago" },
          country: { type: "string", example: "Chile" },
          lat: { type: "number", example: -33.4489 },
          lon: { type: "number", example: -70.6693 },
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
      Store: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          lat: { type: "number" },
          lon: { type: "number" },
          distanceKm: { type: "number" },
          website: { type: "string", format: "uri" },
          phone: { type: "string" },
          openingHours: { type: "string" },
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
