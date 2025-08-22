// src/components/kanban/KanbanTaskCard.jsx  
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useDrag } from 'react-dnd';
import StarBadgeComponent from '../ui/StarIcon';
import LabelTooltip from '../ui/LabelTooltip';

const CardContainer = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
  padding: clamp(14px, 2.5vw, 18px);
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.4vw, 3px);
  cursor: pointer;
  opacity: ${({ isDragging }) => (isDragging ? 0.6 : 1)};
  position: relative;
  width: 100%;
  min-height: clamp(110px, 16vh, 130px);
  box-sizing: border-box;

  &:hover .checkbox-container {
    opacity: 1;
  }

  &:hover .id-time-group:not(.checked) {
    transform: translateX(20px);
  }

  &.checked .id-time-group {
    transform: translateX(20px);
  }

  &.checked .checkbox-container {
    opacity: 1;
  }

`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: clamp(1px, 0.2vw, 2px);
  position: relative;
`;

const CheckboxContainer = styled.div`
  position: absolute;
  top: 3px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
`;

const Checkbox = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid #000000;
  border-radius: 3px;
  background: ${props => props.checked ? '#000000' : '#fff'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    border-color: #000000;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  ${props => props.checked && `
    &:after {
      content: '✓';
      color: white;
      font-size: 9px;
      font-weight: bold;
      line-height: 1;
    }
  `}
`;

const IdTimeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.2vw, 8px);
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

const IssueId = styled.span`
  font-size: clamp(12px, 2vw, 14px);
  color: #697189;
  font-weight: 500;
  white-space: nowrap;
`;

const TimestampContainer = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(3px, 0.6vw, 4px);
`;

const Timestamp = styled.span`
  font-size: clamp(12px, 2vw, 14px);
  color: #697189;
  font-weight: 400;
  white-space: nowrap;
  flex-shrink: 0;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const DiamondIcon = styled.svg`
  width: clamp(18px, 3vw, 21px);
  height: clamp(18px, 3vw, 21px);
  color: #1f2937;
  flex-shrink: 0;
  margin-right: clamp(2px, 0vw, 2px);

  @media (hover: none) and (pointer: coarse) {
    width: clamp(22px, 3.6vw, 26px);
    height: clamp(22px, 3.6vw, 26px);
  }
`;

const CardTitle = styled.div`
  font-size: clamp(15px, 2.6vw, 17px);
  font-weight: 600;
  color: #24344a;
  line-height: 1.3;
  margin: clamp(2px, 0.4vw, 3px) 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
`;

const BadgesRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: clamp(4px, 0.8vw, 6px);
  flex-wrap: nowrap;
`;

const BadgesGroup = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.2vw, 8px);
  flex-wrap: nowrap;
  flex-shrink: 0;
`;

const PriorityBadge = styled.span`
  background: ${props => {
    switch (props.priority) {
      case 'Critical': return '#8b1538';
      case 'High': return '#dc2626';
      case 'Medium': return '#f97316';
      case 'Low': return '#eab308';
      default: return '#6b7280';
    }
  }};
  color: white;
  font-size: clamp(12px, 2vw, 13px);
  font-weight: 600;
  padding: clamp(2px, 0.4vw, 3px) clamp(6px, 1.2vw, 8px);
  border-radius: clamp(8px, 1.5vw, 10px);
  text-transform: capitalize;
  white-space: nowrap;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
`;

const LabelsBadge = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  font-size: clamp(12px, 2vw, 13px);
  font-weight: 500;
  padding: clamp(2px, 0.4vw, 3px) clamp(4px, 1vw, 6px);
  border-radius: clamp(8px, 1.5vw, 10px);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  height: auto;
  flex-shrink: 0;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const LabelDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color || '#6b7280'};
  margin-right: 4px;
  flex-shrink: 0;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(5px, 1vw, 6px);
  flex-shrink: 0;
  margin-left: clamp(4px, 0.8vw, 6px);
`;

const CircularRating = styled.div`
  position: relative;
  width: clamp(16px, 2.8vw, 18px);
  height: clamp(16px, 2.8vw, 18px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transform: translateY(-2px);
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
  }
  
  transition: all 0.2s ease;
`;

const SegmentedCircle = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
`;

const Segment = styled.div`
  position: absolute;
  width: 2px;
  height: clamp(4px, 0.8vw, 5px);
  background: ${props => props.filled ? props.color : '#e5e7eb'};
  border-radius: 0.5px;
  transform-origin: 50% clamp(3px, 0.4vw, 4px);
  transform: ${props => `rotate(${props.angle}deg) translateY(clamp(-5px, -1vw, -6px))`};
  transition: background 0.3s ease;
  top: 50%;
  left: 50%;
  margin-left: -1.25px;
  margin-top: clamp(-2px, -0.4vw, -2.5px);
`;

const RatingText = styled.span`
  font-size: clamp(15px, 2.6vw, 17px);
  font-weight: 500;
  color: #24344a;
  white-space: nowrap;
`;

const BadgeIcon = styled.div`
  width: clamp(20px, 3.2vw, 24px);
  height: clamp(20px, 3.2vw, 24px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  background: transparent;
  border: none;
  position: relative;
  
  svg {
    width: 100%;
    height: 100%;
  }

  @media (hover: none) and (pointer: coarse) {
    width: clamp(24px, 3.6vw, 28px);
    height: clamp(24px, 3.6vw, 28px);
  }
`;

const VerificationTooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: #1e293b;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 1000;
  pointer-events: none;
  max-width: 200px;
  word-wrap: break-word;
  white-space: normal;
  
  &:after {
    content: '';
    position: absolute;
    top: 100%;
    right: 12px;
    border: 4px solid transparent;
    border-top-color: #1e293b;
  }
  
  ${BadgeIcon}:hover &.selected {
    opacity: 1;
    visibility: visible;
  }
  
  @media (max-width: 768px) {
    right: -8px;
    max-width: 160px;
    font-size: 11px;
    padding: 6px 10px;
    
    &:after {
      right: 10px;
    }
  }
`;

const ContextMenu = styled.div`
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
`;

const ContextMenuItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.danger ? '#dc2626' : '#374151'};
  
  &:hover {
    background: ${props => props.danger ? '#fef2f2' : '#f9fafb'};
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &:only-child {
    border-radius: 8px;
  }
`;



/**
 * KanbanTaskCard Component
 * 
 * A highly interactive task card component for the Kanban board with drag-and-drop,
 * context menus, labels, ratings, and priority indicators.
 * 
 * @param {Object} props Component props
 * @param {Object} props.task Task object containing id, title, priority, rating, labels, etc.
 * @param {Function} props.onTaskUpdate Callback for updating task properties
 * @param {Function} props.onTaskDelete Callback for deleting the task
 * @param {Function} props.onTaskEdit Callback for editing the task
 * @param {string} props.columnId ID of the column containing this task
 * @param {Array} props.availableLabels Array of available label objects
 * @returns {JSX.Element} Rendered task card component
 */
function KanbanTaskCard({
  task,
  onTaskUpdate,
  onTaskDelete,
  onTaskEdit,
  onTaskDrop,
  columnId,
  availableLabels = []
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [isStarred, setIsStarred] = useState(task.starred || false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showLabelTooltip, setShowLabelTooltip] = useState(false);
  const cardRef = useRef(null);

  // Update card classes when checkbox state changes
  useEffect(() => {
    if (cardRef.current) {
      if (isChecked) {
        cardRef.current.classList.add('checked');
      } else {
        cardRef.current.classList.remove('checked');
      }
    }
  }, [isChecked]);

  const [{ isDragging }, drag] = useDrag({
    type: 'KANBAN_TASK',
    item: { id: task.id, columnId: columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  // Memoized priority color calculation for performance
  const priorityColor = useMemo(() => {
    switch (task.priority) {
      case 'Critical': return '#8b1538';
      case 'High': return '#dc2626';
      case 'Medium': return '#f97316';
      case 'Low': return '#eab308';
      default: return '#6b7280';
    }
  }, [task.priority]);

  // Memoized rating segments generation for performance
  const ratingSegments = useMemo(() => {
    const segments = [];
    const ratingValue = task.rating || 8.8;
    const filledSegments = Math.round((ratingValue / 10) * 12);

    for (let i = 0; i < 12; i++) {
      const isFilled = i < filledSegments;
      const delay = i * 0.05; // Staggered animation delay

      segments.push(
        <Segment
          key={i}
          angle={i * 30} // 360 / 12 = 30 degrees
          filled={isFilled}
          color={priorityColor}
          style={{
            animationDelay: `${delay}s`,
            opacity: isFilled ? 1 : 0.3
          }}
        />
      );
    }
    return segments;
  }, [task.rating, priorityColor]);

  // Optimized event handlers with useCallback for referential stability
  const handleCheckboxClick = useCallback((e) => {
    e.stopPropagation();

    if (!isChecked) {
      setIsChecked(true);
      setShowContextMenu(true);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
    } else {
      setIsChecked(false);
      setShowContextMenu(false);
    }
  }, [isChecked]);

  const handleBadgeClick = useCallback((e) => {
    e.stopPropagation();
    const newStarred = !isStarred;
    setIsStarred(newStarred);

    if (onTaskUpdate) {
      onTaskUpdate(task.id, { starred: newStarred });
    }
  }, [isStarred, onTaskUpdate, task.id]);

  const handleCardClick = useCallback((e) => {
    e.stopPropagation();
    // Card click no longer opens edit modal - use checkbox menu instead
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const handleEditClick = useCallback(() => {
    setShowContextMenu(false);
    setIsChecked(false); // Reset checkbox after action - useEffect will handle class removal

    if (onTaskEdit) {
      onTaskEdit(task.id);
    }
  }, [onTaskEdit, task.id]);

  const handleDeleteClick = useCallback(() => {
    setShowContextMenu(false);
    setIsChecked(false); // Reset checkbox after action - useEffect will handle class removal

    if (onTaskDelete) {
      onTaskDelete(task.id);
    }
  }, [onTaskDelete, task.id]);

  // Format timestamp
  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      const day = date.getDate();
      const month = date.toLocaleDateString('en', { month: 'short' });
      const time = date.toLocaleTimeString('en', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return `${day} ${month}, ${time}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const ratingValue = task.rating || 8.8;

  // Get label objects from IDs
  const getTaskLabels = () => {
    if (!task.labels || !Array.isArray(task.labels)) return [];
    return task.labels
      .map(labelId => availableLabels.find(label => label.id === labelId))
      .filter(Boolean);
  };

  // Get label display text for the badge
  const getLabelDisplayText = () => {
    const labels = getTaskLabels();
    if (labels.length === 0) return 'No labels';
    if (labels.length === 1) return labels[0].name;

    // For multiple labels, show first label and count
    const firstLabelName = labels[0].name;
    if (firstLabelName.length > 8) {
      return `${firstLabelName.substring(0, 6)}...`;
    }
    return `${firstLabelName} +${labels.length - 1}`;
  };

  // Get the color of the first label for the dot
  const getFirstLabelColor = () => {
    const labels = getTaskLabels();
    return labels.length > 0 ? labels[0].color : '#6b7280';
  };

  // Handle label badge click - show tooltip with all labels
  const handleLabelClick = (e) => {
    e.stopPropagation();
    setShowLabelTooltip(!showLabelTooltip);
  };



  return (
    <>
      <CardContainer
        ref={(node) => {
          drag(node);
          cardRef.current = node;
        }}
        isDragging={isDragging}
        className={`card-container`}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
      >
        <HeaderRow>
          <CheckboxContainer className="checkbox-container" isChecked={isChecked}>
            <Checkbox
              checked={isChecked}
              onClick={handleCheckboxClick}
            />
          </CheckboxContainer>

          <IdTimeGroup className={`id-time-group ${isChecked ? 'checked' : ''}`}>
            <IssueId>#{task.id ? String(task.id).slice(-4).padStart(4, '0') : '8793'}</IssueId>
            <TimestampContainer>
              <Timestamp>{formatTimestamp(task.createdAt)}</Timestamp>
            </TimestampContainer>
          </IdTimeGroup>

          <IconContainer>
            <DiamondIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.712 4.33a9.027 9.027 0 0 1 1.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 0 0-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 0 1 0 9.424m-4.138-5.976a3.736 3.736 0 0 0-.88-1.388 3.737 3.737 0 0 0-1.388-.88m2.268 2.268a3.765 3.765 0 0 1 0 2.528m-2.268-4.796a3.765 3.765 0 0 0-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 0 1-1.388.88m2.268-2.268 4.138 3.448m0 0a9.027 9.027 0 0 1-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0-3.448-4.138m3.448 4.138a9.014 9.014 0 0 1-9.424 0m5.976-4.138a3.765 3.765 0 0 1-2.528 0m0 0a3.736 3.736 0 0 1-1.388-.88 3.737 3.737 0 0 1-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 0 1-1.652-1.306 9.027 9.027 0 0 1-1.306-1.652m0 0 4.138-3.448M4.33 16.712a9.014 9.014 0 0 1 0-9.424m4.138 5.976a3.765 3.765 0 0 1 0-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 0 1 1.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 0 0-1.652 1.306A9.025 9.025 0 0 0 4.33 7.288" />
            </DiamondIcon>
          </IconContainer>
        </HeaderRow>

        <CardTitle>{task.title}</CardTitle>

        <BadgesRow>
          <BadgesGroup>
            <PriorityBadge priority={task.priority}>
              {task.priority}
            </PriorityBadge>

            <LabelTooltip
              labels={getTaskLabels()}
              isOpen={showLabelTooltip}
              onToggle={setShowLabelTooltip}
            >
              <LabelsBadge>
                <LabelDot color={getFirstLabelColor()} />
                {getLabelDisplayText()}
              </LabelsBadge>
            </LabelTooltip>

            <RatingContainer>
              <CircularRating>
                <SegmentedCircle>
                  {ratingSegments}
                </SegmentedCircle>
              </CircularRating>
              <RatingText>{ratingValue}</RatingText>
            </RatingContainer>
          </BadgesGroup>

          <BadgeIcon>
            <StarBadgeComponent
              isActive={isStarred}
              onClick={handleBadgeClick}
            />
            <VerificationTooltip className={isStarred ? 'selected' : ''}>
              Verified by ramvanumu07@gmail.com
            </VerificationTooltip>
          </BadgeIcon>
        </BadgesRow>

      </CardContainer>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={handleCloseContextMenu}
          />
          <ContextMenu
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y
            }}
          >
            <ContextMenuItem onClick={handleEditClick}>
              Edit Task
            </ContextMenuItem>
            <ContextMenuItem danger onClick={handleDeleteClick}>
              Delete Task
            </ContextMenuItem>
          </ContextMenu>
        </>
      )}
    </>
  );
}

export default React.memo(KanbanTaskCard);