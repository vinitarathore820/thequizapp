import { useMemo } from 'react';

const QuestionCard = ({
  question,
  options,
  value,
  onChange
}) => {
  const groupName = useMemo(() => `q_${Math.random().toString(16).slice(2)}`, []);

  return (
    <div className="card p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-snug">
        {question}
      </div>

      <div className="mt-6 space-y-3">
        {options.map((opt, idx) => {
          const checked = value === opt;
          return (
            <label
              key={`${opt}_${idx}`}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                checked
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500'
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                className="mt-1 h-4 w-4 accent-primary-600"
              />
              <div className="flex-1">
                <div className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
