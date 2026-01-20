const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Read package.json directly using the correct path
const packageJson = require(path.join(__dirname, '../package.json'));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QuizApp API Documentation',
      version: packageJson.version || '1.0.0',
      description: 'API documentation for QuizApp',
      contact: {
        name: 'QuizApp Support',
        email: 'support@quizapp.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
