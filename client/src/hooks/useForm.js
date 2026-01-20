import { useState } from 'react';

/**
 * Custom hook for handling form state and validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function
 * @returns {Object} Form utilities
 */
const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change
   * @param {Object} e - Event object
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  /**
   * Handle form submission
   * @param {Function} callback - Callback function to execute on form submission
   * @returns {Promise<Object>} Form submission result
   */
  const handleSubmit = (callback) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Run validation if validate function is provided
    const validationErrors = validate ? validate(values) : {};
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        const result = await callback(values);
        setIsSubmitting(false);
        return { success: true, data: result };
      } catch (error) {
        setIsSubmitting(false);
        return { success: false, error };
      }
    } else {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return { success: false, errors: validationErrors };
    }
  };

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues,
    setErrors,
    resetForm,
  };
};

export default useForm;
