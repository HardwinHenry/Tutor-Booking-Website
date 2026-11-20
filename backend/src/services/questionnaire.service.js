const {
  QUESTIONNAIRE_VERSION,
  LEARNER_QUESTIONS,
  TUTOR_QUESTIONS,
} = require('../constants/questionnaire.config');
const { ROLES } = require('../constants/roles');
const Taxonomy = require('../models/taxonomy.model');

/**
 * Retrieve questionnaire structure and questions for a specific role
 * Populates options for root-level questions directly connected to active Taxonomies.
 */
const getQuestionnaireByRole = async (role, requestedVersion = null) => {
  const isLearner = role === ROLES.LEARNER;
  const rawQuestions = isLearner ? LEARNER_QUESTIONS : TUTOR_QUESTIONS;

  // Identify taxonomy types used by root questions (questions without dependencies)
  const rootTaxonomyTypes = [
    ...new Set(
      rawQuestions.filter((q) => q.taxonomyType && !q.dependsOn).map((q) => q.taxonomyType)
    ),
  ];

  // Fetch active taxonomies for those types
  const activeTaxonomies = await Taxonomy.find({
    type: { $in: rootTaxonomyTypes },
    parentId: null,
    active: true,
  }).sort({ sortOrder: 1, name: 1 });

  // Group taxonomies by type
  const taxonomiesByType = {};
  for (const item of activeTaxonomies) {
    if (!taxonomiesByType[item.type]) {
      taxonomiesByType[item.type] = [];
    }
    taxonomiesByType[item.type].push({
      id: item._id,
      name: item.name,
      slug: item.slug,
      type: item.type,
      description: item.description,
    });
  }

  // Construct questions list with pre-populated root options
  const questions = rawQuestions.map((q) => {
    const questionCopy = { ...q };

    // If question has dynamic taxonomy type and no parent dependency, attach options
    if (q.taxonomyType && !q.dependsOn && taxonomiesByType[q.taxonomyType]) {
      questionCopy.options = taxonomiesByType[q.taxonomyType];
    }

    return questionCopy;
  });

  return {
    version: QUESTIONNAIRE_VERSION,
    requestedVersion: requestedVersion || QUESTIONNAIRE_VERSION,
    role,
    totalQuestions: questions.length,
    questions,
  };
};

module.exports = {
  getQuestionnaireByRole,
};
