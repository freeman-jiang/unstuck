import { useRef, useState, useEffect } from "react";
import { GhostCursor } from "../lib/GhostCursor";
import { BoundingBoxHighlight } from "../lib/BoundingBoxHighlight";
import { useUnstuck } from "../contexts/UnstuckContext";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorkflowStep {
  elementId: string;
  boundingBox: BoundingBox | null;
  waitForInteraction?: boolean;
}

interface SelectionState {
  id: string;
  selected: boolean;
  expanded: boolean;
  timestamp: number;
}

interface WorkflowCreatorProps {
  elementId: string;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const WorkflowCreator: React.FC<WorkflowCreatorProps> = ({ 
  elementId, 
  onComplete,
  autoStart = false
}) => {
  const ghostCursorRef = useRef<GhostCursor | null>(null);
  const highlightRef = useRef<BoundingBoxHighlight | null>(null);
  const selectionStatesRef = useRef<Map<string, SelectionState>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);

  const updateSelectionState = (element: Element) => {
    const id = element.getAttribute('data-unstuck-id');
    if (!id) return;

    const newState: SelectionState = {
      id,
      selected: element.getAttribute('aria-selected') === 'true' || 
                element.classList.contains('selected'),
      expanded: element.getAttribute('aria-expanded') === 'true',
      timestamp: Date.now()
    };

    selectionStatesRef.current.set(id, newState);

    if (isPlaying) {
      console.log('Selection state updated:', { id, state: newState });
    }
  };

  const validateInteractiveElement = (elementId: string): { boundingBox: BoundingBox | null } => {
    const elements = document.querySelectorAll(`[data-unstuck-id="${elementId}"]`);
    if (!elements || elements.length === 0) {
      console.warn(`No element found with data-unstuck-id: ${elementId}`);
      return { boundingBox: null };
    }

    const element = elements[0];
    const boundingBox = element.getBoundingClientRect();
    console.log('Found element:', { elementId, boundingBox });

    return { boundingBox };
  };

  const getWorkflowStep = (): WorkflowStep | null => {
    const { boundingBox } = validateInteractiveElement(elementId);
    
    return {
      elementId,
      boundingBox,
      waitForInteraction: true,
    };
  };

  const executeWorkflow = async () => {
    if (isPlaying) return;
    console.log('Starting workflow...');
    
    // Initialize workflow step
    const step = getWorkflowStep();
    if (!step || !step.boundingBox) {
      console.error('No valid workflow step found');
      return;
    }

    setCurrentStep(step);
    setIsPlaying(true);

    // Initialize ghost cursor
    ghostCursorRef.current = new GhostCursor({
      color: 'rgba(75, 75, 255, 0.8)',
      size: 16,
      glowColor: 'rgba(75, 75, 255, 0.4)',
      glowSize: 16,
      moveDuration: 1000,
      debug: false,
    });

    // Initialize highlight box
    highlightRef.current = new BoundingBoxHighlight({
      color: 'rgba(75, 75, 255, 0.8)',
      glowColor: 'rgba(75, 75, 255, 0.4)',
      glowSize: 4,
      debug: false,
    });

    // Set initial cursor position
    const mouseX = window.innerWidth - 100;
    const mouseY = window.innerHeight - 100;
    ghostCursorRef.current.setPosition(mouseX, mouseY);
    
    // Small delay before starting movement
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Move cursor to target
    const targetX = step.boundingBox.x + step.boundingBox.width / 2;
    const targetY = step.boundingBox.y + step.boundingBox.height / 2;
    await ghostCursorRef.current.moveTo(targetX, targetY);

    // Add delay before showing the highlight box
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Show highlight box
    highlightRef.current.show(step.boundingBox, '');
  };

  const handleElementInteraction = async (elementId: string) => {
    if (!isPlaying || !ghostCursorRef.current || !highlightRef.current || !currentStep) {
      console.log('Interaction ignored:', { isPlaying, elementId });
      return;
    }

    if (currentStep.elementId === elementId) {
      // Wait a short moment to ensure any state changes have propagated
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Hide the highlight box
      highlightRef.current.hide();
      
      // Short delay before hiding cursor for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      // Hide the cursor with a fade out effect
      ghostCursorRef.current.hide();
      
      // Wait for animations to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Clear the selection state for this element
      selectionStatesRef.current.delete(elementId);
      
      // Workflow complete
      cleanup();
      onComplete?.();
    }
  };

  const cleanup = () => {
    console.log('Cleaning up demo');
    if (ghostCursorRef.current) {
      ghostCursorRef.current.destroy();
      ghostCursorRef.current = null;
    }
    if (highlightRef.current) {
      highlightRef.current.destroy();
      highlightRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(null);
  };

  useEffect(() => {
    // Setup mutation observer to watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          const unstuckId = mutation.target.getAttribute('data-unstuck-id');
          if (unstuckId) {
            handleElementInteraction(unstuckId);
          }
        }
      });
    });

    // Watch for attribute changes on the entire document
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-selected', 'aria-expanded', 'class', 'data-unstuck-id'],
      subtree: true
    });

    // Setup event listeners for selection-related events
    const handleEvent = (event: Event) => {
      const element = event.target as Element;
      if (element && element.getAttribute('data-unstuck-id')) {
        updateSelectionState(element);
      }
    };

    const events = ['click', 'mousedown', 'mouseup'];

    events.forEach(eventType => {
      document.addEventListener(eventType, handleEvent, true);
    });

    // Cleanup
    return () => {
      observer.disconnect();
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleEvent, true);
      });
    };
  }, [isPlaying]);

  useEffect(() => {
    if (autoStart) {
      executeWorkflow();
    }
    return cleanup;
  }, [autoStart]);

  if (!autoStart) {
    return (
      <button
        onClick={executeWorkflow}
        disabled={isPlaying}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '6px',
          border: 'none',
          background: isPlaying ? '#ccc' : '#4B4BFF',
          color: 'white',
          cursor: isPlaying ? 'default' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
      >
        {isPlaying ? 'Running Demo' : 'Start Demo'}
      </button>
    );
  }
  
  return null;
};