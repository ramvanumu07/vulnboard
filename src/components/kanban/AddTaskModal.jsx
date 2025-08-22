// src/components/kanban/AddTaskModal.jsx
import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import LabelSelector from '../ui/LabelSelector';
import { sanitizeTaskData } from '../../utils/inputSanitization';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    border: none;
    
    &:hover {
      background: #2563eb;
    }
    
    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

const NumberInput = styled(Input)`
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;

const CharacterCount = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-align: right;
  margin-top: 4px;
`;

/**
 * AddTaskModal Component
 * 
 * Modal dialog for creating new tasks with comprehensive validation,
 * accessibility features, and input sanitization.
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is currently open
 * @param {Function} props.onClose Callback to close the modal
 * @param {Function} props.onSubmit Callback to submit the new task
 * @param {string} props.columnId ID of the column to add the task to
 * @param {Array} props.availableLabels Array of available label objects
 * @returns {JSX.Element|null} Rendered modal or null if closed
 */
function AddTaskModal({ isOpen, onClose, onSubmit, columnId, availableLabels = [] }) {
  // Default values - no defaults for priority and rating (user must select/enter)
  const getDefaultValues = () => ({
    title: '',
    priority: '',
    rating: '',
    labels: [] // Labels are optional
  });

  const [formData, setFormData] = useState(getDefaultValues());
  const [errors, setErrors] = useState({});

  // Enhanced form validation with input sanitization
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Sanitize inputs before validation
    const sanitizedData = sanitizeTaskData(formData);

    // Title validation
    if (!sanitizedData.title || sanitizedData.title.trim().length === 0) {
      newErrors.title = 'Task title is required';
    } else if (sanitizedData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    // Priority validation
    if (!formData.priority) {
      newErrors.priority = 'Priority level is required';
    }

    // Rating validation
    if (!formData.rating || formData.rating.trim() === '') {
      newErrors.rating = 'Rating is required';
    } else {
      const rating = parseFloat(formData.rating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        newErrors.rating = 'Rating must be between 0.0 and 10.0';
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, sanitizedData };
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const { isValid, sanitizedData } = validateForm();

    if (!isValid) {
      return;
    }

    try {
      const rating = parseFloat(formData.rating);
      onSubmit(columnId, {
        title: sanitizedData.title,
        priority: formData.priority,
        rating: Math.min(Math.max(rating, 0), 10),
        starred: false,
        labels: sanitizedData.labels || []
      });

      // Reset form
      setFormData(getDefaultValues());
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    }
  }, [validateForm, formData.rating, formData.priority, columnId, onSubmit, onClose]);

  const handleClose = () => {
    // Reset form to default values
    setFormData(getDefaultValues());
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.priority !== '' &&
      formData.rating.trim() !== ''
    );
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-modal-title"
      aria-describedby="add-task-modal-description"
    >
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="add-task-modal-title">Add New Task</ModalTitle>
          <CloseButton
            onClick={handleClose}
            aria-label="Close add task modal"
            type="button"
          >
            ×
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter task title..."
              maxLength={200}
              required
              aria-describedby={errors.title ? "title-error" : "title-help"}
              aria-invalid={errors.title ? "true" : "false"}
              aria-required="true"
            />
            <CharacterCount>{formData.title.length}/200</CharacterCount>
            {errors.title && <ErrorMessage id="title-error" role="alert">{errors.title}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="priority">Priority *</Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              required
            >
              <option value="">Select priority level...</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
            {errors.priority && <ErrorMessage>{errors.priority}</ErrorMessage>}
          </FormGroup>



          <FormGroup>
            <Label htmlFor="rating">Rating (0.0 - 10.0) *</Label>
            <NumberInput
              id="rating"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.rating}
              onChange={(e) => handleChange('rating', e.target.value)}
              placeholder="Enter rating..."
              required
            />
            {errors.rating && <ErrorMessage>{errors.rating}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="labels">Labels</Label>
            <LabelSelector
              selectedLabels={formData.labels}
              availableLabels={availableLabels}
              onLabelsChange={(labels) => handleChange('labels', labels)}
              placeholder="Select labels for this task..."
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid()}
            >
              Create Task
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default React.memo(AddTaskModal);