const express = require('express');
const questionnaireController = require('../controllers/questionnaire.controller');
const { validateQuestionnaireRole } = require('../validators/taxonomy.validator');

const router = express.Router();

// GET /api/questionnaires/:role - Get 28 questions for 'learner' or 'tutor'
router.get('/:role', validateQuestionnaireRole, questionnaireController.getQuestionnaire);

module.exports = router;
