require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const QuestionType = require('../models/QuestionType');
const Category = require('../models/Category');
const Question = require('../models/Question');

const questionsByCategory = require('./data/questions');

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'seed-admin@quizapp.com';
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'Password123!';

const typeCategoryMap = [
  {
    type: 'Academic',
    categories: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'Computer Science'
    ]
  },
  {
    type: 'Competitive Exam',
    categories: [
      'Quantitative Aptitude',
      'Logical Reasoning',
      'Verbal Ability',
      'General Awareness',
      'Current Affairs',
      'Data Interpretation'
    ]
  },
  {
    type: 'General Knowledge',
    categories: [
      'History',
      'Geography',
      'Indian Polity',
      'Indian Economy',
      'Science & Technology',
      'Static GK'
    ]
  },
  {
    type: 'Professional / Tech',
    categories: [
      'Programming',
      'Web Development',
      'Databases',
      'Operating Systems',
      'Networking',
      'Cyber Security'
    ]
  },
  {
    type: 'Fun & Lifestyle',
    categories: [
      'Movies',
      'Music',
      'Sports',
      'Celebrities',
      'Food & Cuisine',
      'Travel'
    ]
  },
  {
    type: 'Brain & Logic',
    categories: [
      'Puzzles',
      'IQ Test',
      'Pattern Recognition',
      'Critical Thinking',
      'Riddles'
    ]
  }
];

const normalizeCategoryName = (name) => {
  if (!name) return name;
  const trimmed = String(name).trim();
  if (trimmed.endsWith('_Questions')) {
    return trimmed.replace(/_Questions$/, '').replace(/_/g, ' ');
  }
  return trimmed;
};

const normalizeQuestions = (questions) => {
  return questions.map((q) => ({
    ...q,
    category: normalizeCategoryName(q.category)
  }));
};

const canonicalizeNameForMatch = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
};

const categoryAliasesForMatch = {
  ScienceTech: 'Science & Technology'
};

const resolveCategoryAliasForMatch = (category) => {
  return categoryAliasesForMatch[category] || category;
};

const connect = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(process.env.MONGODB_URI);
};

const getOrCreateSeedAdmin = async () => {
  let user = await User.findOne({ email: seedAdminEmail }).select('+password');
  if (user) return user;

  user = await User.create({
    name: 'Seed Admin',
    email: seedAdminEmail,
    password: seedAdminPassword,
    role: 'admin',
    isEmailVerified: true
  });

  return user;
};

const destroy = async () => {
  await QuestionType.deleteMany({});
  await Category.deleteMany({});
  await Question.deleteMany({});
  await User.deleteOne({ email: seedAdminEmail });
};

const seedTypes = async () => {
  const uniqueTypes = [...new Set(typeCategoryMap.map(g => g.type))];
  await QuestionType.deleteMany({});
  const typeDocs = await QuestionType.insertMany(uniqueTypes.map(name => ({ name })));
  return new Map(typeDocs.map(t => [t.name, t._id]));
};

const seedCategories = async ({ typeIdByName }) => {
  if (!typeIdByName || typeIdByName.size === 0) {
    const existingTypes = await QuestionType.find().select('name');
    typeIdByName = new Map(existingTypes.map(t => [t.name, t._id]));
  }

  if (!typeIdByName || typeIdByName.size === 0) {
    throw new Error('Cannot seed categories: no QuestionType records found. Seed types first.');
  }

  let idCounter = 9_000;
  const categoriesToInsert = [];
  for (const group of typeCategoryMap) {
    for (const name of group.categories) {
      const typeId = typeIdByName.get(group.type);
      if (!typeId) {
        throw new Error(`Cannot seed categories: missing typeId for type=${group.type}`);
      }

      categoriesToInsert.push({
        id: idCounter++,
        typeId,
        type: group.type,
        name
      });
    }
  }

  await Category.deleteMany({});
  await Category.insertMany(categoriesToInsert, { ordered: true });
};

const seedQuestions = async ({ admin }) => {
  const typeCount = await QuestionType.countDocuments();
  const categoryCount = await Category.countDocuments();
  if (typeCount === 0 || categoryCount === 0) {
    throw new Error('Cannot seed questions: types/categories are missing. Seed types and categories first.');
  }

  const categoryDocs = await Category.find().select('_id id name type typeId');
  const categoryByKey = new Map(
    categoryDocs.map(c => [
      `${canonicalizeNameForMatch(c.type)}::${canonicalizeNameForMatch(c.name)}`,
      c
    ])
  );

  await Question.deleteMany({});

  // Flatten questions from questionsByCategory
  const allQuestions = [];
  for (const arr of Object.values(questionsByCategory)) {
    if (Array.isArray(arr)) allQuestions.push(...arr);
  }

  if (!allQuestions.length) {
    throw new Error('No questions found in seeder/data/questions.js export');
  }

  const normalizedAllQuestions = normalizeQuestions(allQuestions);

  const questionsToInsert = normalizedAllQuestions.map((q) => {
    const quizType = q.quizType;
    const categoryName = q.category;
    const resolvedCategoryName = resolveCategoryAliasForMatch(categoryName);
    const cat = categoryByKey.get(
      `${canonicalizeNameForMatch(quizType)}::${canonicalizeNameForMatch(resolvedCategoryName)}`
    );

    if (!cat) {
      throw new Error(`Category not found for question. type=${quizType}, category=${categoryName}`);
    }

    return {
      question: q.question,
      typeId: cat.typeId,
      categoryId: cat.id,
      categoryRef: cat._id,
      quizType,
      category: categoryName,
      type: q.type || 'multiple',
      difficulty: q.difficulty,
      correct_answer: q.correct_answer,
      incorrect_answers: q.incorrect_answers,
      explanation: q.explanation,
      createdBy: admin._id
    };
  });

  await Question.insertMany(questionsToInsert, { ordered: false });
};

const seed = async ({ seedTypesFlag, seedCategoriesFlag, seedQuestionsFlag }) => {
  const admin = await getOrCreateSeedAdmin();

  let typeIdByName;
  if (seedTypesFlag) {
    typeIdByName = await seedTypes();
  }
  if (seedCategoriesFlag) {
    await seedCategories({ typeIdByName });
  }
  if (seedQuestionsFlag) {
    await seedQuestions({ admin });
  }
};

const run = async () => {
  await connect();

  const args = new Set(process.argv.slice(2));
  const shouldDestroy = args.has('--destroy');

  const hasAnySeedFlag = args.has('--types') || args.has('--categories') || args.has('--questions');
  const seedTypesFlag = args.has('--types') || !hasAnySeedFlag;
  const seedCategoriesFlag = args.has('--categories') || !hasAnySeedFlag;
  const seedQuestionsFlag = args.has('--questions') || !hasAnySeedFlag;

  if (shouldDestroy) {
    if (!hasAnySeedFlag) {
      await destroy();
      return;
    }

    if (seedQuestionsFlag) await Question.deleteMany({});
    if (seedCategoriesFlag) await Category.deleteMany({});
    if (seedTypesFlag) await QuestionType.deleteMany({});
    await User.deleteOne({ email: seedAdminEmail });
    return;
  }

  await seed({ seedTypesFlag, seedCategoriesFlag, seedQuestionsFlag });
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
