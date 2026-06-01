import { useState, useEffect, useCallback, useRef } from 'react';
import { validatePlatformValue, getValidationState } from '@AC/Agent/PlatformValidation';

/**
 * Custom hook for field validation with debouncing and persistence
 *
 * @param {Object} options - Hook configuration options
 * @param {Object} options.initialValues - Initial field values { [fieldId]: value }
 * @param {Object} options.initialInteracted - Initial interaction state { [fieldId]: boolean }
 * @param {number} options.validationDelay - Delay before showing validation (default: 1000ms)
 * @param {Function} options.onInteractionChange - Callback when interaction state changes
 * @param {Function} options.validateField - Custom validation function (default: validatePlatformValue)
 * @returns {Object} Validation utilities and state
 */
export function useFieldValidation({
  initialValues = {},
  initialInteracted = {},
  validationDelay = 1000,
  onInteractionChange = null,
  validateField = validatePlatformValue,
} = {}) {
  const [hasInteracted, setHasInteracted] = useState(initialInteracted);
  const [isVerifying, setIsVerifying] = useState({});
  const [showValidation, setShowValidation] = useState({});
  const validationTimeouts = useRef({});
  const typingTimeouts = useRef({});

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts.current).forEach(clearTimeout);
      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Handle field value change with debounced validation
  const handleFieldChange = useCallback((fieldId, value) => {
    // Clear existing timeouts
    if (validationTimeouts.current[fieldId]) {
      clearTimeout(validationTimeouts.current[fieldId]);
    }
    if (typingTimeouts.current[fieldId]) {
      clearTimeout(typingTimeouts.current[fieldId]);
    }

    // Start verifying immediately if there's a value
    if (value) {
      setIsVerifying(prev => ({ ...prev, [fieldId]: true }));

      // Set typing timeout to stop verifying AND show validation together
      // This creates a seamless UX: verifying spinner shows during delay,
      // then simultaneously stops and shows the validation result
      typingTimeouts.current[fieldId] = setTimeout(() => {
        setIsVerifying(prev => ({ ...prev, [fieldId]: false }));
        setShowValidation(prev => ({ ...prev, [fieldId]: true }));
        setHasInteracted(prev => {
          const newState = { ...prev, [fieldId]: true };
          onInteractionChange?.(newState);
          return newState;
        });
      }, validationDelay);
    } else {
      // Clear validation states for empty values
      setIsVerifying(prev => ({ ...prev, [fieldId]: false }));
      setShowValidation(prev => ({ ...prev, [fieldId]: false }));
    }
  }, [validationDelay, onInteractionChange]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldId) => {
    // Clear typing timeout since we're blurring
    if (typingTimeouts.current[fieldId]) {
      clearTimeout(typingTimeouts.current[fieldId]);
    }

    // Stop verifying and show validation immediately on blur
    setIsVerifying(prev => ({ ...prev, [fieldId]: false }));
    setHasInteracted(prev => {
      const newState = { ...prev, [fieldId]: true };
      onInteractionChange?.(newState);
      return newState;
    });
    setShowValidation(prev => ({ ...prev, [fieldId]: true }));
  }, [onInteractionChange]);

  // Get validation state for a field
  const getFieldValidationState = useCallback((fieldId, value, platformType = 'username') => {
    const isValid = validateField(fieldId, value);
    const shouldShowValidation = hasInteracted[fieldId] || showValidation[fieldId];

    return getValidationState({
      isVerifying: isVerifying[fieldId],
      isValid: isValid,
      value: value,
      hasInteracted: shouldShowValidation,
      platformType: platformType
    });
  }, [hasInteracted, showValidation, isVerifying, validateField]);

  // Reset validation state for a field
  const resetFieldValidation = useCallback((fieldId) => {
    setHasInteracted(prev => {
      const newState = { ...prev, [fieldId]: false };
      onInteractionChange?.(newState);
      return newState;
    });
    setIsVerifying(prev => ({ ...prev, [fieldId]: false }));
    setShowValidation(prev => ({ ...prev, [fieldId]: false }));

    // Clear any pending timeouts
    if (validationTimeouts.current[fieldId]) {
      clearTimeout(validationTimeouts.current[fieldId]);
    }
    if (typingTimeouts.current[fieldId]) {
      clearTimeout(typingTimeouts.current[fieldId]);
    }
  }, [onInteractionChange]);

  // Reset all validation states
  const resetAllValidation = useCallback(() => {
    setHasInteracted({});
    setIsVerifying({});
    setShowValidation({});
    onInteractionChange?.({});

    // Clear all timeouts
    Object.values(validationTimeouts.current).forEach(clearTimeout);
    Object.values(typingTimeouts.current).forEach(clearTimeout);
    validationTimeouts.current = {};
    typingTimeouts.current = {};
  }, [onInteractionChange]);

  return {
    hasInteracted,
    isVerifying,
    showValidation,
    handleFieldChange,
    handleFieldBlur,
    getFieldValidationState,
    resetFieldValidation,
    resetAllValidation,
  };
}
