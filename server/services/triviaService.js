// services/triviaService.js
const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');

const API_BASE_URL = 'https://opentdb.com';

class TriviaService {
  constructor() {
    this.sessionToken = null;
    this.tokenExpiry = null;
    this.lastRequestTime = 0;
  }

  // Add rate limiting
  async makeRequest(url, params = {}) {
    // Enforce rate limiting (1 request per second)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }

    try {
      this.lastRequestTime = Date.now();
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // If rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, 5100));
        return this.makeRequest(url, params);
      }
      throw error;
    }
  }

  async getSessionToken() {
    if (this.sessionToken && this.tokenExpiry > Date.now()) {
      return this.sessionToken;
    }

    try {
      const data = await this.makeRequest(`${API_BASE_URL}/api_token.php`, { command: 'request' });
      this.sessionToken = data.token;
      this.tokenExpiry = Date.now() + 19800000; // 5.5 hours
      return this.sessionToken;
    } catch (error) {
      throw new ErrorResponse('Failed to get session token from Trivia API', 500);
    }
  }

  async resetSessionToken() {
    try {
      const token = await this.getSessionToken();
      await this.makeRequest(`${API_BASE_URL}/api_token.php`, {
        command: 'reset',
        token
      });
      this.tokenExpiry = Date.now() + 19800000;
    } catch (error) {
      // If reset fails, get a new token
      return this.getSessionToken();
    }
  }

  async getCategories() {
    try {
      const data = await this.makeRequest(`${API_BASE_URL}/api_category.php`);
      return data.trivia_categories;
    } catch (error) {
      throw new ErrorResponse('Failed to fetch categories from Trivia API', 500);
    }
  }

  async getQuestionCount(categoryId) {
    try {
      const data = await this.makeRequest(`${API_BASE_URL}/api_count.php`, { category: categoryId });
      return data.category_question_count;
    } catch (error) {
      throw new ErrorResponse('Failed to fetch question count from Trivia API', 500);
    }
  }

  async getQuestions({ amount = 10, category, difficulty, type = 'multiple' }) {
    const token = await this.getSessionToken();
    const params = {
      amount: parseInt(amount),
      type,
      token
    };

    if (category && category !== 'any') params.category = category;
    if (difficulty && difficulty !== 'any') params.difficulty = difficulty;

    try {
      const data = await this.makeRequest(`${API_BASE_URL}/api.php`, params);
      
      switch (data.response_code) {
        case 0: return data.results;
        case 1: throw new ErrorResponse('No questions found for the specified criteria', 404);
        case 2: throw new ErrorResponse('Invalid parameters provided', 400);
        case 3: 
          await this.getSessionToken();
          return this.getQuestions({ amount, category, difficulty, type });
        case 4:
          await this.resetSessionToken();
          return this.getQuestions({ amount, category, difficulty, type });
        default:
          throw new ErrorResponse('Unknown error from Trivia API', 500);
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TriviaService();