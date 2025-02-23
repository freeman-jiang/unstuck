import { useRef, useState, useEffect } from "react";
import { GhostCursor } from "../lib/GhostCursor";
import { BoundingBoxHighlight } from "../lib/BoundingBoxHighlight";
import { useUnstuck } from "../contexts/UnstuckContext";

// Declare global type for cleanup functions
declare global {
  interface Window {
    _unstuckCleanupFns: (() => void)[];
  }
}

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

  // Add throttle function to limit scroll updates
  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(...args: any[]) {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // Function to update positions based on current element position
  const updatePositions = () => {
    if (!isPlaying || !currentStep?.elementId || !currentStep.boundingBox) return;

    const { boundingBox } = validateInteractiveElement(currentStep.elementId);
    if (!boundingBox) return;

    // Update the current step's bounding box
    setCurrentStep(prev => prev ? {
      ...prev,
      boundingBox
    } : null);

    // Update highlight box position
    if (highlightRef.current) {
      highlightRef.current.show(boundingBox, '');
    }

    // Update ghost cursor position if it exists and is visible
    if (ghostCursorRef.current) {
      const targetX = boundingBox.x + boundingBox.width / 2;
      const targetY = boundingBox.y + boundingBox.height / 2;
      ghostCursorRef.current.setPosition(targetX, targetY);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    if (!isPlaying) return;

    // Throttle the update function to improve performance
    const throttledUpdate = throttle(updatePositions, 16); // ~60fps

    window.addEventListener('scroll', throttledUpdate, { passive: true });
    window.addEventListener('resize', throttledUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledUpdate);
      window.removeEventListener('resize', throttledUpdate);
    };
  }, [isPlaying, currentStep?.elementId]);

  const validateInteractiveElement = (elementId: string): { boundingBox: BoundingBox | null, error?: string } => {
    try {
      if (!elementId) {
        return { boundingBox: null, error: 'No element ID provided' };
      }

      // First try by unstuck ID
      let element: Element | null = null;
      let usedSelector: string | null = null;
      
      // Try each selector separately to avoid invalid selector errors
      const selectors = [
        `[data-unstuck-id="${elementId}"]`,
        `#${CSS.escape(elementId)}`,
        `[id="${CSS.escape(elementId)}"]`,
        `[data-testid="${CSS.escape(elementId)}"]`,
        `[name="${CSS.escape(elementId)}"]`
      ];

      // Try each selector until we find an element
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements && elements.length > 0) {
            element = elements[0];
            usedSelector = selector;
            break;
          }
        } catch (error) {
          console.warn(`Invalid selector: ${selector}`, error);
          continue;
        }
      }

      if (!element) {
        const error = `No element found with identifier: ${elementId}. Tried selectors: ${selectors.join(', ')}`;
        console.warn(error);
        return { boundingBox: null, error };
      }

      // Verify the element is visible and has dimensions
      const boundingBox = element.getBoundingClientRect();
      if (boundingBox.width === 0 || boundingBox.height === 0) {
        const error = `Element found with ${usedSelector} but has no dimensions`;
        console.warn(error);
        return { boundingBox: null, error };
      }

      // Check if element is visible in viewport
      const isVisible = boundingBox.top < window.innerHeight && 
                       boundingBox.bottom > 0 && 
                       boundingBox.left < window.innerWidth && 
                       boundingBox.right > 0;

      if (!isVisible) {
        const error = `Element found with ${usedSelector} but is not visible in viewport`;
        console.warn(error);
        return { boundingBox: null, error };
      }

      console.log('Found valid interactive element:', { 
        elementId, 
        selector: usedSelector,
        boundingBox,
        tagName: element.tagName,
        classes: element.className
      });

      return { boundingBox };
    } catch (error) {
      const errorMessage = `Error validating interactive element: ${error}`;
      console.error(errorMessage);
      return { boundingBox: null, error: errorMessage };
    }
  };

  const updateSelectionState = (element: Element) => {
    // Try unstuck ID first
    let id = element.getAttribute('data-unstuck-id');
    
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

  const getWorkflowStep = (): WorkflowStep | null => {
    const { boundingBox, error } = validateInteractiveElement(elementId);
    
    if (!boundingBox) {
      console.error('Failed to create workflow step:', error);
      return null;
    }
    
    return {
      elementId,
      boundingBox,
      waitForInteraction: true,
    };
  };

  const executeWorkflow = async () => {
    if (isPlaying) return;
    
    try {
      console.log('Starting workflow...');
      
      // Initialize workflow step
      const step = getWorkflowStep();
      if (!step || !step.boundingBox) {
        throw new Error('No valid workflow step found');
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
      
      // Check if cursor still exists before operations
      if (!ghostCursorRef.current) {
        throw new Error('Ghost cursor was cleaned up');
      }
      ghostCursorRef.current.setPosition(mouseX, mouseY);
      
      // Small delay before starting movement
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Revalidate element position before moving
      const { boundingBox: updatedBox } = validateInteractiveElement(step.elementId);
      if (!updatedBox) {
        throw new Error('Target element no longer found');
      }

      // Check again if cursor exists before moving
      if (!ghostCursorRef.current) {
        throw new Error('Ghost cursor was cleaned up');
      }

      // Move cursor to target
      const targetX = updatedBox.x + updatedBox.width / 2;
      const targetY = updatedBox.y + updatedBox.height / 2;
      await ghostCursorRef.current.moveTo(targetX, targetY);

      // Add delay before showing the highlight box
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Final check before showing highlight
      if (!highlightRef.current || !ghostCursorRef.current) {
        throw new Error('Visual elements were cleaned up');
      }

      // Show highlight box
      highlightRef.current.show(updatedBox, '');
    } catch (error) {
      console.error('Error during workflow execution:', error);
      // Always clean up and complete on error
      cleanup();
      onComplete?.();
      // Return early to prevent further execution
      return;
    }
  };

  const cleanup = () => {
    // Prevent multiple cleanups
    if (!isPlaying) return;
    
    console.log('Cleaning up demo');
    try {
      setIsPlaying(false); // Set this first to prevent further interactions
      setCurrentStep(null);

      // Clean up ghost cursor
      if (ghostCursorRef.current) {
        ghostCursorRef.current.destroy();
        ghostCursorRef.current = null;
      }

      // Clean up highlight box
      if (highlightRef.current) {
        highlightRef.current.hide();
        highlightRef.current.destroy();
        highlightRef.current = null;
      }

      // Clean up selection states
      if (selectionStatesRef.current) {
        selectionStatesRef.current.clear();
      }

      // Clean up event listeners last
      if (window._unstuckCleanupFns) {
        window._unstuckCleanupFns.forEach(fn => fn());
        window._unstuckCleanupFns = [];
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const handleElementInteraction = async (elementId: string) => {
    if (!isPlaying || !ghostCursorRef.current || !highlightRef.current || !currentStep) {
      console.log('Interaction ignored:', { isPlaying, elementId });
      return;
    }

    if (currentStep.elementId === elementId) {
      try {
        // Set a flag to prevent multiple interactions
        setIsPlaying(false);
        
        // Wait a short moment to ensure any state changes have propagated
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        // Check if components still exist
        if (!highlightRef.current || !ghostCursorRef.current) {
          throw new Error('Visual elements were cleaned up');
        }

        // Hide the highlight box
        highlightRef.current.hide();
        
        // Short delay before hiding cursor for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        // Check again before final operations
        if (!ghostCursorRef.current) {
          throw new Error('Ghost cursor was cleaned up');
        }

        // Hide the cursor with a fade out effect
        ghostCursorRef.current.hide();
        
        // Wait for animations to complete
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Do the cleanup after animations
        cleanup();
        
        // Finally call onComplete
        onComplete?.();
      } catch (error) {
        console.error('Error during interaction cleanup:', error);
        cleanup();
        onComplete?.();
      }
    }
  };

  // Add click handler function
  const handleClick = async () => {
    console.log('Starting handleClick', { isPlaying, currentStep });
    if (!isPlaying || !currentStep?.elementId) return;

    try {
      const element = document.querySelector(`[data-unstuck-id="${currentStep.elementId}"]`) as HTMLElement;
      console.log('Found element to click:', element);
      if (!element) return;

      // Trigger click animation
      if (ghostCursorRef.current) {
        console.log('Starting ghost cursor click animation');
        await ghostCursorRef.current.click();
        console.log('Finished ghost cursor click animation');
      }

      // Simulate the click event
      console.log('Dispatching click event');
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        // Add these to make the click more "real"
        detail: 1, // number of clicks
        screenX: 0, // coordinates
        screenY: 0,
        clientX: 0,
        clientY: 0,
      });
      element.dispatchEvent(clickEvent);
      console.log('Click event dispatched');

      // Also try native click() method as backup
      element.click();
      console.log('Native click() called');
    } catch (error) {
      console.error('Error during click:', error);
    }
  };

  // Expose click handler to parent components
  useEffect(() => {
    if (!window._unstuckCleanupFns) {
      window._unstuckCleanupFns = [];
    }
    window._unstuckCleanupFns.push(() => {
      (window as any)._unstuckHandleClick = undefined;
    });
    (window as any)._unstuckHandleClick = handleClick;
  }, [isPlaying, currentStep]);

  useEffect(() => {
    // Setup mutation observer to watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          // Try unstuck ID first
          let unstuckId = mutation.target.getAttribute('data-unstuck-id');
          
          // If no unstuck ID, try other identifiers
          if (!unstuckId) {
            unstuckId = (mutation.target as Element).id || 
                       mutation.target.getAttribute('data-testid') || 
                       mutation.target.getAttribute('name');
          }

          if (unstuckId && isPlaying) {
            handleElementInteraction(unstuckId);
          }
        }
      });
    });

    // Watch for attribute changes on the entire document
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-selected', 'aria-expanded', 'class', 'data-unstuck-id', 'id', 'data-testid', 'name'],
      subtree: true
    });

    // Setup event listeners for selection-related events
    const handleEvent = (event: Event) => {
      const element = event.target as Element;
      if (!element || !isPlaying) return;

      // Try unstuck ID first
      let unstuckId = element.getAttribute('data-unstuck-id');
      
      // If no unstuck ID, try other identifiers
      if (!unstuckId) {
        unstuckId = element.id || 
                    element.getAttribute('data-testid') || 
                    element.getAttribute('name');
      }

      if (unstuckId) {
        updateSelectionState(element);
        // If this is the target element we're looking for, handle the interaction
        if (currentStep?.elementId === unstuckId) {
          handleElementInteraction(unstuckId);
        }
      }
    };

    // Add keyboard event listener for tab key
    const handleKeyDown = async (event: KeyboardEvent) => {
      console.log('handling keydown')
      if (event.key === 'Tab' && currentStep?.elementId) {
        console.log("trying to click", currentStep.elementId)
        event.preventDefault(); // Prevent default tab behavior
        
        const element = document.querySelector(`[data-unstuck-id="${currentStep.elementId}"]`) as HTMLElement;
        if (element) {
          console.log("Found element, clicking:", element);
          element.click();
        }
      } else {
        console.log("Not playing right now.")
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        cleanup();
      }
    };

    // Handle page unload/navigation
    const handleUnload = () => {
      if (isPlaying) {
        cleanup();
      }
    };

    const events = ['click', 'mousedown'];
    events.forEach(eventType => {
      document.addEventListener(eventType, handleEvent, true);
    });

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown, true);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);

    // Store cleanup function
    const cleanupFn = () => {
      observer.disconnect();
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleEvent, true);
      });
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('unload', handleUnload);
    };

    if (!window._unstuckCleanupFns) {
      window._unstuckCleanupFns = [];
    }
    window._unstuckCleanupFns.push(cleanupFn);

    // Only cleanup event listeners on unmount, not on every effect change
    return () => {
      if (isPlaying) {
        cleanupFn();
      }
    };
  }, [isPlaying]); // Only re-run when isPlaying changes

  useEffect(() => {
    if (autoStart) {
      executeWorkflow();
    }
    // Don't return cleanup here as it will be handled by the main cleanup effect
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