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
  // instruction: string;
  // label: string;
  boundingBox: BoundingBox | null;
  waitForInteraction?: boolean;
  // instructionOffset?: {
  //   x?: number;
  //   y?: number;
  // };
}

interface SelectionState {
  id: string;
  selected: boolean;
  expanded: boolean;
  timestamp: number;
}

interface WorkflowCreatorProps {
  elementIds?: string[];
  // instructions?: Record<string, string>;
  onComplete?: () => void;
}

export const WorkflowCreator: React.FC<WorkflowCreatorProps> = ({ 
  elementIds = ['div-div-button-6'], 
  // instructions = {"help button": "Click the help button"}, 
  onComplete 
}) => {
  const ghostCursorRef = useRef<GhostCursor | null>(null);
  const highlightRef = useRef<BoundingBoxHighlight | null>(null);
  const selectionStatesRef = useRef<Map<string, SelectionState>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const { interactives } = useUnstuck();

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

  // const isElementSelected = (elementId: string): boolean => {
  //   const state = selectionStatesRef.current.get(elementId);
  //   if (!state) return false;

  //   return state.selected || state.expanded;
  // };

  const validateInteractiveElement = (elementId: string): { boundingBox: BoundingBox | null; /* label: string */ } => {
    // Query all elements with data-unstuck-id attribute
    const elements = document.querySelectorAll(`[data-unstuck-id="${elementId}"]`);
    if (!elements || elements.length === 0) {
      console.warn(`No element found with data-unstuck-id: ${elementId}`);
      return { boundingBox: null /*, label: '' */ };
    }

    // Get the first matching element
    const element = elements[0];
    const boundingBox = element.getBoundingClientRect();
    // const label = element.getAttribute('aria-label') || 
    //              element.getAttribute('title') || 
    //              element.textContent?.trim() || 
    //              'Unknown';

    console.log('Found element:', { elementId, boundingBox /*, label */ });

    return {
      boundingBox,
      // label
    };
  };

  const getWorkflowSteps = (): WorkflowStep[] => {
    return elementIds.map((elementId) => {
      const { boundingBox /*, label */ } = validateInteractiveElement(elementId);
      return {
        elementId,
        // instruction: instructions[elementId] || `Click the ${label}`,
        // label,
        boundingBox,
        waitForInteraction: true,
        // instructionOffset: { y: -60 },
      };
    });
  };

  const executeWorkflow = async () => {
    if (isPlaying) return;
    console.log('Starting workflow...');
    
    // Initialize workflow steps
    const steps = getWorkflowSteps();
    if (steps.length === 0) {
      console.error('No valid workflow steps found');
      return;
    }

    setWorkflowSteps(steps);
    setIsPlaying(true);
    setCurrentStepIndex(0);
    
    const currentStep = steps[0];
    if (!currentStep?.boundingBox) {
      const { boundingBox } = validateInteractiveElement(currentStep.elementId);
      if (!boundingBox) {
        console.error('Could not find element position');
        cleanup();
        return;
      }
      currentStep.boundingBox = boundingBox;
    }

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
    const targetX = currentStep.boundingBox.x + currentStep.boundingBox.width / 2;
    const targetY = currentStep.boundingBox.y + currentStep.boundingBox.height / 2;
    await ghostCursorRef.current.moveTo(targetX, targetY);

    // Add delay before showing the highlight box
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Show highlight box with instruction
    highlightRef.current.show(
      currentStep.boundingBox,
      // currentStep.instruction
      '' // Empty string instead of instruction
    );
  };

  const handleElementInteraction = async (elementId: string) => {
    if (!isPlaying || !ghostCursorRef.current || !highlightRef.current || currentStepIndex >= workflowSteps.length) {
      console.log('Interaction ignored:', { isPlaying, currentStepIndex, elementId });
      return;
    }

    const currentStep = workflowSteps[currentStepIndex];
    console.log('Processing interaction:', { elementId, currentStep });

    if (currentStep.elementId === elementId) {
      // Wait a short moment to ensure any state changes have propagated
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // if (!isElementSelected(elementId)) {
      //   console.log('Element interaction did not result in selection:', elementId);
      //   return;
      // }

      // console.log('Element selected, cleaning up visual elements');
      
      // First hide the highlight box and label
      highlightRef.current.hide();
      
      // Short delay before hiding cursor for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      // Hide the cursor with a fade out effect
      ghostCursorRef.current.hide();
      
      // Wait for animations to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      console.log('Completing step:', currentStepIndex);
      
      // Move to next step
      const nextStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextStepIndex);
      
      // Clear the selection state for this element
      selectionStatesRef.current.delete(elementId);
      
      // If there's a next step, execute it after a small delay
      if (nextStepIndex < workflowSteps.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const nextStep = workflowSteps[nextStepIndex];
        if (!nextStep.boundingBox) {
          const element = interactives.find((el) => el.id === nextStep.elementId);
          if (!element?.boundingBox) {
            console.error('Could not find element position for next step');
            cleanup();
            return;
          }
          // Update the workflow step with the new bounding box
          const updatedSteps = [...workflowSteps];
          updatedSteps[nextStepIndex] = {
            ...nextStep,
            boundingBox: element.boundingBox
          };
          setWorkflowSteps(updatedSteps);
          nextStep.boundingBox = element.boundingBox;
        }

        // Show cursor again
        ghostCursorRef.current.show();
        
        // Move to next target
        const targetX = nextStep.boundingBox.x + nextStep.boundingBox.width / 2;
        const targetY = nextStep.boundingBox.y + nextStep.boundingBox.height / 2;
        await ghostCursorRef.current.moveTo(targetX, targetY);

        // Show highlight box with instruction
        await new Promise((resolve) => setTimeout(resolve, 50));
        highlightRef.current.show(
          nextStep.boundingBox,
          // nextStep.instruction
          '' // Empty string instead of instruction
        );
      } else {
        // Workflow complete
        cleanup();
        onComplete?.();
      }
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
    setCurrentStepIndex(0);
    setWorkflowSteps([]);
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
    return cleanup;
  }, []);

  return (
    <button
      onClick={executeWorkflow}
      disabled={isPlaying || elementIds.length === 0}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '6px',
        border: 'none',
        background: isPlaying || elementIds.length === 0 ? '#ccc' : '#4B4BFF',
        color: 'white',
        cursor: isPlaying || elementIds.length === 0 ? 'default' : 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000,
      }}
    >
      {isPlaying ? `Step ${currentStepIndex + 1}/${workflowSteps.length}` : elementIds.length === 0 ? 'No Steps' : 'Start Demo'}
    </button>
  );
};