// src/pages/HomePage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import FullPageLoader from '../components/FullPageLoader';
import TypeSelect from '../components/TypeSelect';
import CategorySelect from '../components/CategorySelect';
import DifficultySelect from '../components/DifficultySelect';

const EMPTY_ARRAY = [];

const HomePage = () => {
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [errorMessage, setErrorMessage] = useState('');
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

  const {
    data: typesData,
    isLoading: isLoadingTypes,
    error: typesError
  } = useQuery({
    queryKey: ['questionTypes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/questions/types`);
      const list = response?.data?.data;
      console.log("list types...", list.length)
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const types = Array.isArray(typesData) ? typesData : EMPTY_ARRAY;

  useEffect(() => {
    setSelectedCategory('');
  }, [selectedType]);

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery({
    queryKey: ['questionCategories'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/questions/categories`);
      const list = response?.data?.data;
      console.log("list categories...", list.length)
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : EMPTY_ARRAY;

  useEffect(() => {
    const err = typesError || categoriesError;
    if (!err) return;
    setErrorMessage(err?.response?.data?.error || err?.message || 'Failed to load data');
  }, [typesError, categoriesError]);

  const visibleCategories = useMemo(() => {
    if (!selectedType) return EMPTY_ARRAY;
    return categories.filter((c) => String(c.typeId) === String(selectedType));
  }, [categories, selectedType]);

  const handleStartQuiz = () => {
    if (!selectedType || !selectedCategory) {
      return;
    }

    const selectedTypeObj = types.find((t) => String(t.id) === String(selectedType));

    navigate('/quiz/new', {
      state: {
        quizType: selectedTypeObj?.name,
        typeId: selectedType,
        categoryId: selectedCategory,
        difficulty,
        amount: 10,
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
            Ready for a quick challenge 🚀<br/>{user?.name ? `${user.name}` : ''}?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Pick a topic, choose your difficulty, and start playing.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="flex items-start justify-between gap-3">
              <div>{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="rounded px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900/40"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 overflow-visible">
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
                  {`${visibleCategories.length} categories`}
                </span>
              </div>
              <CategorySelect
                categories={visibleCategories}
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

            <div className="pt-2">
              <button
                onClick={handleStartQuiz}
                disabled={!selectedType || !selectedCategory || isLoadingCategories}
                className="btn btn-primary w-full"
              >
                Start playing
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;