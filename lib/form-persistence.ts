// Form data persistence utilities
export interface FormData {
  [key: string]: unknown;
}

// Save form data to localStorage
export const saveFormData = (formKey: string, data: FormData): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`form_${formKey}`, JSON.stringify(data));
    }
  } catch (error) {
    console.warn('Failed to save form data:', error);
  }
};

// Load form data from localStorage
export const loadFormData = (formKey: string): FormData => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`form_${formKey}`);
      return saved ? JSON.parse(saved) : {};
    }
  } catch (error) {
    console.warn('Failed to load form data:', error);
  }
  return {};
};

// Clear form data from localStorage
export const clearFormData = (formKey: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`form_${formKey}`);
    }
  } catch (error) {
    console.warn('Failed to clear form data:', error);
  }
};

// Auto-save form data with debounce
export const createAutoSave = (formKey: string, delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout;
  
  return (data: FormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveFormData(formKey, data);
    }, delay);
  };
};
