import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';

const DifficultySelect = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select difficulty',
}) => {
  const options = [
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
  ];

  const selected = options.find((o) => o.id === value) || null;

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative mt-1">
        <Listbox.Button className="select h-10 text-sm flex items-center justify-between bg-blue-20 dark:bg-blue-400/20" id="difficulty">
          <span className="block truncate">{selected ? selected.name : placeholder}</span>
          <span className="pointer-events-none ml-2">▾</span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {options.map((option) => (
              <Listbox.Option
                key={option.id}
                value={option.id}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-900 dark:text-gray-100'
                  }`
                }
              >
                {({ selected: isSelected }) => (
                  <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                    {option.name}
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default DifficultySelect;
