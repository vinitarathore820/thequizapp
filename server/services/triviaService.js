// services/triviaService.js
// Open Trivia / external API support has been removed. This project is now DB-backed.

module.exports = new Proxy(
  {},
  {
    get() {
      throw new Error('TriviaService has been removed. Use DB-backed Question/Category/QuestionType models instead.');
    }
  }
);