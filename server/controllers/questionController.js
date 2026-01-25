// controllers/questionController.js
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Category = require('../models/Category');
const Question = require('../models/Question');
const QuestionType = require('../models/QuestionType');
const mongoose = require('mongoose');

// @desc    Get all quiz types
// @route   GET /api/v1/questions/types
// @access  Public
exports.getTypes = asyncHandler(async (req, res, next) => {
  const types = await QuestionType.find().sort({ name: 1 }).select('_id name');

  const typeCounts = await Question.aggregate([
    {
      $group: {
        _id: '$typeId',
        questionCount: { $sum: 1 }
      }
    }
  ]);

  const countByTypeId = new Map(typeCounts.map(r => [String(r._id), r.questionCount]));
  const data = types.map(t => ({
    id: t._id,
    name: t.name,
    questionCount: countByTypeId.get(String(t._id)) || 0
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get categories (optionally filtered by quiz type)
// @route   GET /api/v1/questions/categories?type=...
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const { type, typeId } = req.query;

  const filter = {};
  if (typeId) {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return next(new ErrorResponse('Invalid typeId', 400));
    }
    filter.typeId = typeId;
  } else if (type) {
    filter.type = type;
  }

  const categories = await Category.find(filter).sort({ name: 1 }).select('_id id name type typeId');

  const categoryCounts = await Question.aggregate([
    {
      $match: {
        categoryRef: { $in: categories.map(c => c._id) }
      }
    },
    {
      $group: {
        _id: { categoryRef: '$categoryRef', difficulty: '$difficulty' },
        count: { $sum: 1 }
      }
    }
  ]);

  const countsByCategoryId = new Map();
  for (const row of categoryCounts) {
    const catId = String(row._id.categoryRef);
    const difficulty = row._id.difficulty;
    if (!countsByCategoryId.has(catId)) {
      countsByCategoryId.set(catId, { easy: 0, medium: 0, hard: 0 });
    }
    const obj = countsByCategoryId.get(catId);
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
      obj[difficulty] = row.count;
    }
  }

  const data = categories.map(c => {
    const difficultyCounts = countsByCategoryId.get(String(c._id)) || { easy: 0, medium: 0, hard: 0 };
    const questionCount = difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard;
    return {
      id: c._id,
      legacyId: c.id,
      name: c.name,
      type: c.type,
      typeId: c.typeId,
      questionCount,
      difficultyCounts
    };
  });

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get question count for a category
// @route   GET /api/v1/questions/count/:categoryId
// @access  Public
exports.getQuestionCount = asyncHandler(async (req, res, next) => {
  const raw = req.params.categoryId;
  const match = {};
  if (mongoose.Types.ObjectId.isValid(raw)) {
    match.categoryRef = raw;
  } else {
    const categoryId = Number(raw);
    if (!Number.isFinite(categoryId)) {
      return next(new ErrorResponse('Invalid categoryId', 400));
    }
    match.categoryId = categoryId;
  }

  const [easy, medium, hard] = await Promise.all([
    Question.countDocuments({ ...match, difficulty: 'easy' }),
    Question.countDocuments({ ...match, difficulty: 'medium' }),
    Question.countDocuments({ ...match, difficulty: 'hard' })
  ]);

  const count = {
    total_question_count: easy + medium + hard,
    total_easy_question_count: easy,
    total_medium_question_count: medium,
    total_hard_question_count: hard
  };

  res.status(200).json({
    success: true,
    data: count
  });
});

// @desc    Get question count (optionally filtered by typeId and/or one/many categoryIds)
// @route   GET /api/v1/questions/count?typeId=...&categoryIds=...
// @access  Public
exports.getQuestionCountCombined = asyncHandler(async (req, res, next) => {
  const { typeId, categoryIds } = req.query;

  const includeRaw = typeof req.query.include === 'string' ? req.query.include : '';
  const includeSet = new Set(
    includeRaw
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  );
  const breakdown = String(req.query.breakdown || '').toLowerCase() === 'true';
  if (breakdown && includeSet.size === 0) {
    includeSet.add('types');
    includeSet.add('categories');
  }

  let categoryTokens = [];
  if (typeof categoryIds === 'string' && categoryIds.trim()) {
    categoryTokens = categoryIds
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  const objectIdCategoryRefs = [];
  const numericCategoryIds = [];
  for (const token of categoryTokens) {
    if (mongoose.Types.ObjectId.isValid(token)) {
      objectIdCategoryRefs.push(token);
    } else {
      const n = Number(token);
      if (!Number.isFinite(n)) {
        return next(new ErrorResponse('Invalid categoryIds', 400));
      }
      numericCategoryIds.push(n);
    }
  }

  const match = {};

  if (typeId) {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return next(new ErrorResponse('Invalid typeId', 400));
    }

    const categoriesForType = await Category.find({ typeId }).select('_id id');
    if (categoriesForType.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total_question_count: 0,
          total_easy_question_count: 0,
          total_medium_question_count: 0,
          total_hard_question_count: 0
        }
      });
    }

    const typeRefs = categoriesForType.map(c => String(c._id));
    const typeLegacyIds = categoriesForType.map(c => c.id).filter(n => Number.isFinite(n));

    if (objectIdCategoryRefs.length || numericCategoryIds.length) {
      const allowedRefs = new Set(typeRefs);
      const allowedLegacy = new Set(typeLegacyIds);
      const filteredRefs = objectIdCategoryRefs.filter(id => allowedRefs.has(String(id)));
      const filteredLegacy = numericCategoryIds.filter(id => allowedLegacy.has(id));

      if (filteredRefs.length) objectIdCategoryRefs.splice(0, objectIdCategoryRefs.length, ...filteredRefs);
      else objectIdCategoryRefs.splice(0, objectIdCategoryRefs.length);

      if (filteredLegacy.length) numericCategoryIds.splice(0, numericCategoryIds.length, ...filteredLegacy);
      else numericCategoryIds.splice(0, numericCategoryIds.length);

      if (objectIdCategoryRefs.length === 0 && numericCategoryIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            total_question_count: 0,
            total_easy_question_count: 0,
            total_medium_question_count: 0,
            total_hard_question_count: 0
          }
        });
      }
    } else {
      objectIdCategoryRefs.push(...typeRefs);
      numericCategoryIds.push(...typeLegacyIds);
    }
  }

  if (objectIdCategoryRefs.length || numericCategoryIds.length) {
    const or = [];
    if (objectIdCategoryRefs.length) or.push({ categoryRef: { $in: objectIdCategoryRefs } });
    if (numericCategoryIds.length) or.push({ categoryId: { $in: numericCategoryIds } });
    match.$or = or;
  }

  const [easy, medium, hard] = await Promise.all([
    Question.countDocuments({ ...match, difficulty: 'easy' }),
    Question.countDocuments({ ...match, difficulty: 'medium' }),
    Question.countDocuments({ ...match, difficulty: 'hard' })
  ]);

  const response = {
    success: true,
    data: {
      total_question_count: easy + medium + hard,
      total_easy_question_count: easy,
      total_medium_question_count: medium,
      total_hard_question_count: hard
    }
  };

  if (includeSet.has('types')) {
    const typeAgg = await Question.aggregate([
      { $match: match },
      {
        $group: {
          _id: { typeId: '$typeId', difficulty: '$difficulty' },
          count: { $sum: 1 }
        }
      }
    ]);

    const typeIds = [...new Set(typeAgg.map(r => String(r._id.typeId)).filter(Boolean))];
    const typeDocs = await QuestionType.find({ _id: { $in: typeIds } }).select('_id name');
    const typeNameById = new Map(typeDocs.map(t => [String(t._id), t.name]));

    const countsByType = new Map();
    for (const row of typeAgg) {
      const tId = String(row._id.typeId);
      if (!countsByType.has(tId)) {
        countsByType.set(tId, { easy: 0, medium: 0, hard: 0 });
      }
      const obj = countsByType.get(tId);
      const diff = row._id.difficulty;
      if (diff === 'easy' || diff === 'medium' || diff === 'hard') {
        obj[diff] = row.count;
      }
    }

    response.byType = typeIds
      .map((tId) => {
        const difficultyCounts = countsByType.get(tId) || { easy: 0, medium: 0, hard: 0 };
        const total = difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard;
        return {
          id: tId,
          name: typeNameById.get(tId),
          total,
          difficultyCounts
        };
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  if (includeSet.has('categories')) {
    const catAgg = await Question.aggregate([
      { $match: match },
      {
        $group: {
          _id: { categoryRef: '$categoryRef', categoryId: '$categoryId', difficulty: '$difficulty' },
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryRefIds = [...new Set(catAgg.map(r => r._id.categoryRef).filter(Boolean).map(String))];
    const legacyIds = [...new Set(catAgg.map(r => r._id.categoryId).filter(v => typeof v === 'number'))];

    const [catDocsByRef, catDocsByLegacy] = await Promise.all([
      categoryRefIds.length
        ? Category.find({ _id: { $in: categoryRefIds } }).select('_id id name type typeId')
        : Promise.resolve([]),
      legacyIds.length
        ? Category.find({ id: { $in: legacyIds } }).select('_id id name type typeId')
        : Promise.resolve([])
    ]);

    const catByRef = new Map(catDocsByRef.map(c => [String(c._id), c]));
    const catByLegacy = new Map(catDocsByLegacy.map(c => [c.id, c]));

    const countsByCategoryKey = new Map();
    const order = [];
    const getKey = (row) => {
      if (row._id.categoryRef) return `ref:${String(row._id.categoryRef)}`;
      if (typeof row._id.categoryId === 'number') return `legacy:${row._id.categoryId}`;
      return 'unknown';
    };

    for (const row of catAgg) {
      const key = getKey(row);
      if (key === 'unknown') continue;
      if (!countsByCategoryKey.has(key)) {
        countsByCategoryKey.set(key, { easy: 0, medium: 0, hard: 0 });
        order.push(key);
      }
      const obj = countsByCategoryKey.get(key);
      const diff = row._id.difficulty;
      if (diff === 'easy' || diff === 'medium' || diff === 'hard') {
        obj[diff] = row.count;
      }
    }

    response.byCategory = order
      .map((key) => {
        const difficultyCounts = countsByCategoryKey.get(key) || { easy: 0, medium: 0, hard: 0 };
        const total = difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard;

        let catDoc;
        if (key.startsWith('ref:')) {
          catDoc = catByRef.get(key.slice(4));
        } else if (key.startsWith('legacy:')) {
          catDoc = catByLegacy.get(Number(key.slice(7)));
        }

        return {
          id: catDoc?._id,
          legacyId: catDoc?.id,
          name: catDoc?.name,
          type: catDoc?.type,
          typeId: catDoc?.typeId,
          total,
          difficultyCounts
        };
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  res.status(200).json(response);
});

// @desc    Get random questions from DB
// @route   GET /api/v1/questions?categoryId=..&difficulty=..&amount=..
// @access  Public
exports.getQuestions = asyncHandler(async (req, res, next) => {
  const { categoryId, difficulty, amount = 10, quizType } = req.query;

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 50) {
    return next(new ErrorResponse('Amount must be between 1 and 50', 400));
  }

  const match = {};
  if (categoryId) {
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      match.categoryRef = categoryId;
    } else {
      const parsedCategoryId = Number(categoryId);
      if (!Number.isFinite(parsedCategoryId)) {
        return next(new ErrorResponse('Invalid categoryId', 400));
      }
      match.categoryId = parsedCategoryId;
    }
  }
  if (difficulty && difficulty !== 'any') match.difficulty = difficulty;
  if (quizType && quizType !== 'any') match.quizType = quizType;

  const available = await Question.countDocuments(match);
  if (available < parsedAmount) {
    return next(new ErrorResponse('No questions found for the specified criteria', 404));
  }

  const questions = await Question.aggregate([
    { $match: match },
    { $sample: { size: parsedAmount } },
    {
      $project: {
        question: 1,
        categoryId: 1,
        quizType: 1,
        category: 1,
        type: 1,
        difficulty: 1,
        correct_answer: 1,
        incorrect_answers: 1,
        explanation: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

// @desc    Create a new quiz type
// @route   POST /api/v1/questions/types
// @access  Private
exports.createType = asyncHandler(async (req, res, next) => {
  const rawName = req.body?.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name) {
    return next(new ErrorResponse('Type name is required', 400));
  }

  const existing = await QuestionType.findOne({ name: new RegExp(`^${name}$`, 'i') }).select('_id');
  if (existing) {
    return next(new ErrorResponse('Type already exists', 400));
  }

  const type = await QuestionType.create({ name });

  res.status(201).json({
    success: true,
    data: {
      id: type._id,
      name: type.name
    }
  });
});

// @desc    Create a new category
// @route   POST /api/v1/questions/categories
// @access  Private
exports.createCategory = asyncHandler(async (req, res, next) => {
  const rawName = req.body?.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  const { typeId } = req.body || {};

  if (!name) {
    return next(new ErrorResponse('Category name is required', 400));
  }

  if (!typeId || !mongoose.Types.ObjectId.isValid(typeId)) {
    return next(new ErrorResponse('Valid typeId is required', 400));
  }

  const typeDoc = await QuestionType.findById(typeId).select('_id name');
  if (!typeDoc) {
    return next(new ErrorResponse('Type not found', 404));
  }

  const existing = await Category.findOne({
    typeId: typeDoc._id,
    name: new RegExp(`^${name}$`, 'i')
  }).select('_id');
  if (existing) {
    return next(new ErrorResponse('Category already exists for this type', 400));
  }

  const last = await Category.findOne().sort({ id: -1 }).select('id');
  const nextId = (last?.id || 0) + 1;

  const category = await Category.create({
    id: nextId,
    typeId: typeDoc._id,
    type: typeDoc.name,
    name
  });

  res.status(201).json({
    success: true,
    data: {
      id: category._id,
      legacyId: category.id,
      name: category.name,
      type: category.type,
      typeId: category.typeId
    }
  });
});

// @desc    Create a new type with multiple categories
// @route   POST /api/v1/questions/types-with-categories
// @access  Private
exports.createTypeWithCategories = asyncHandler(async (req, res, next) => {
  const rawName = req.body?.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  const categoriesRaw = req.body?.categories;

  if (!name) {
    return next(new ErrorResponse('Type name is required', 400));
  }

  if (!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) {
    return next(new ErrorResponse('categories must be a non-empty array', 400));
  }

  const existingType = await QuestionType.findOne({ name: new RegExp(`^${name}$`, 'i') }).select('_id');
  if (existingType) {
    return next(new ErrorResponse('Type already exists', 400));
  }

  const normalizedCategories = categoriesRaw
    .map((c) => {
      if (typeof c === 'string') return c.trim();
      if (c && typeof c === 'object' && typeof c.name === 'string') return c.name.trim();
      return '';
    })
    .filter(Boolean);

  if (normalizedCategories.length === 0) {
    return next(new ErrorResponse('At least one valid category name is required', 400));
  }

  const deduped = [];
  const seen = new Set();
  for (const c of normalizedCategories) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  const type = await QuestionType.create({ name });

  const existingCategories = await Category.find({ typeId: type._id }).select('name');
  if (existingCategories.length) {
    await QuestionType.findByIdAndDelete(type._id);
    return next(new ErrorResponse('Categories already exist for this type', 400));
  }

  const last = await Category.findOne().sort({ id: -1 }).select('id');
  let nextId = (last?.id || 0) + 1;

  const categoryDocs = deduped.map((categoryName) => ({
    id: nextId++,
    typeId: type._id,
    type: type.name,
    name: categoryName
  }));

  const createdCategories = await Category.insertMany(categoryDocs, { ordered: true });

  res.status(201).json({
    success: true,
    data: {
      type: {
        id: type._id,
        name: type.name
      },
      categories: createdCategories.map((c) => ({
        id: c._id,
        legacyId: c.id,
        name: c.name,
        type: c.type,
        typeId: c.typeId
      }))
    }
  });
});