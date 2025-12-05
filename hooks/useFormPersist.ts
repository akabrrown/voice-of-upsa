import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormPersistOptions<T> {
  storageKey: string;
  initialValues: T;
  debounceMs?: number;
  onRestore?: (data: T) => void;
  onSave?: (data: T) => void;
}

export function useFormPersist<T extends object>({
  storageKey,
  initialValues,
  debounceMs = 1000,
  onRestore,
  onSave
}: UseFormPersistOptions<T>) {
  // Use ref to store initial values to avoid dependency issues
  const initialValuesRef = useRef(initialValues);
  const hasRestoredRef = useRef(false);
  
  const [formData, setFormData] = useState<T>(initialValues);
  const [isRestoring, setIsRestoring] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Restore data from localStorage on mount (only once)
  useEffect(() => {
    // Only restore once
    if (hasRestoredRef.current) {
      return;
    }
    hasRestoredRef.current = true;
    
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const restoredData = { ...initialValuesRef.current, ...parsedData };
        setFormData(restoredData);
        onRestore?.(restoredData);
      }
    } catch (error) {
      console.error('Error restoring form data:', error);
    } finally {
      setIsRestoring(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save data to localStorage with debouncing
  const saveToLocalStorage = useCallback(
    (data: T) => {
      try {
        setSaveStatus('saving');
        localStorage.setItem(storageKey, JSON.stringify(data));
        setLastSaved(new Date());
        setSaveStatus('saved');
        onSave?.(data);
        
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error saving form data:', error);
        setSaveStatus('error');
        
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    },
    [storageKey, onSave]
  );

  // Debounced save function
  const debouncedSave = useCallback(
    (data: T) => {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(data);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [debounceMs, saveToLocalStorage]
  );

  // Update form data and trigger save
  const updateFormData = useCallback(
    (newData: Partial<T> | ((prev: T) => T)) => {
      setFormData(prev => {
        const updated = typeof newData === 'function' ? newData(prev) : { ...prev, ...newData };
        
        // Cancel previous timeout and set new one
        const cancelSave = debouncedSave(updated);
        
        // Store cancel function for cleanup
        const currentUpdateFormData = updateFormData as typeof updateFormData & { _cancelSave?: () => void };
        currentUpdateFormData._cancelSave = cancelSave;
        
        return updated;
      });
    },
    [debouncedSave]
  );

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setFormData(initialValuesRef.current);
      setLastSaved(null);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    const currentUpdateFormData = updateFormData as typeof updateFormData & { _cancelSave?: () => void };
    return () => {
      if (currentUpdateFormData._cancelSave) {
        currentUpdateFormData._cancelSave();
      }
    };
  }, [updateFormData]);

  return {
    formData,
    setFormData: updateFormData,
    isRestoring,
    lastSaved,
    saveStatus,
    clearSavedData,
    saveToLocalStorage: () => saveToLocalStorage(formData)
  };
}
