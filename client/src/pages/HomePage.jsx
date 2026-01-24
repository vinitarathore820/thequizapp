// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../services/api';
import FullPageLoader from '../components/FullPageLoader';
import TypeSelect from '../components/TypeSelect';
import CategorySelect from '../components/CategorySelect';
import DifficultySelect from '../components/DifficultySelect';

const HomePage = () => {
  const [selectedType, setSelectedType] = useState('');
  const [types, setTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [availableCount, setAvailableCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isFetchingCount, setIsFetchingCount] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/' } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let isActive = true;

    if (!isAuthenticated) {
      return () => {
        isActive = false;
      };
    }

    const fetchTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const response = await axios.get(`${API_URL}/questions/types`);
        const list = response?.data?.data;
        if (isActive) {
          setTypes(Array.isArray(list) ? list : []);
        }
      } catch {
        if (isActive) {
          setTypes([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingTypes(false);
        }
      }
    };

    fetchTypes();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setSelectedCategory('');
    setCategoryCounts(null);
    setAvailableCount(0);
    setQuestionCount(10);
  }, [selectedType]);

  useEffect(() => {
    let isActive = true;

    const fetchCategories = async () => {
      if (!selectedType) {
        setCategories([]);
        return;
      }

      setIsLoadingCategories(true);
      try {
        const response = await axios.get(`${API_URL}/questions/categories`, {
          params: { type: selectedType }
        });
        const list = response?.data?.data;
        if (isActive) {
          setCategories(Array.isArray(list) ? list : []);
        }
      } catch {
        if (isActive) {
          setCategories([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isActive = false;
    };
  }, [selectedType]);

  useEffect(() => {
    let isActive = true;

    const fetchCount = async () => {
      if (!selectedCategory) {
        setCategoryCounts(null);
        setAvailableCount(0);
        setQuestionCount(10);
        return;
      }

      setIsFetchingCount(true);
      try {
        const response = await axios.get(`${API_URL}/questions/count/${selectedCategory}`);
        const count = response?.data?.data;
        if (isActive) {
          setCategoryCounts(count && typeof count === 'object' ? count : null);
        }
      } catch {
        if (isActive) {
          setCategoryCounts(null);
          setAvailableCount(0);
        }
      } finally {
        if (isActive) {
          setIsFetchingCount(false);
        }
      }
    };

    fetchCount();

    return () => {
      isActive = false;
    };
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory || !categoryCounts) {
      return;
    }

    const byDifficulty = {
      easy: categoryCounts.total_easy_question_count,
      medium: categoryCounts.total_medium_question_count,
      hard: categoryCounts.total_hard_question_count,
    };

    const raw = byDifficulty[difficulty];
    const safeCount = Number.isFinite(raw) ? raw : 0;
    setAvailableCount(safeCount);
    setQuestionCount((prev) => Math.min(prev || 1, safeCount || 10));
  }, [categoryCounts, difficulty, selectedCategory]);

  const handleStartQuiz = () => {
    if (!selectedType || !selectedCategory) {
      return;
    }

    navigate('/quiz/new', {
      state: {
        quizType: selectedType,
        category: selectedCategory,
        difficulty,
        amount: questionCount,
      },
    });
  };

  if (!isAuthenticated || isLoadingTypes) {
    return (
      <FullPageLoader />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Select a category and start your quiz now
          </p>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="space-y-8">
            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="type" className="label">
                  Type
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {`${types.length} types`}
                </span>
              </div>
              <TypeSelect
                types={types}
                value={selectedType}
                onChange={(val) => setSelectedType(val)}
                disabled={isLoadingTypes}
                placeholder="Select a type"
              />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="category" className="label">
                  Category
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {`${categories.length} categories`}
                </span>
              </div>
              <CategorySelect
                categories={categories}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                disabled={!selectedType || isLoadingCategories}
                placeholder="Select a category"
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty" className="label">
                Difficulty
              </label>
              <DifficultySelect
                value={difficulty}
                onChange={(val) => setDifficulty(val)}
                disabled={!selectedCategory || isLoadingCategories}
                placeholder="Select difficulty"
              />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="questionCount" className="label">
                  Number of Questions
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isFetchingCount ? 'Checking...' : `Max: ${availableCount} available`}
                </span>
              </div>
              <input
                type="number"
                id="questionCount"
                min="1"
                max={availableCount || 50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(parseInt(e.target.value), availableCount || 50))}
                className="input bg-blue-20 dark:bg-blue-400/20"
                disabled={!selectedCategory || isFetchingCount || isLoadingCategories}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartQuiz}
                disabled={!selectedType || !selectedCategory || isFetchingCount || isLoadingCategories}
                className="btn btn-primary w-full"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>

        {/* <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Quick Tips</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Select a category to see available questions</li>
            <li>• Questions are randomly selected from the Open Trivia Database</li>
            <li>• You can choose between 1 and {availableCount || '50'} questions</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default HomePage;