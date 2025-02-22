import React, { useEffect, useRef, useState } from 'react';
import { GhostCursor } from '../lib/GhostCursor';

interface WorkflowStep {
  elementId: string;
  instruction: string;
  label: string;
  selector: string; // CSS selector to find the element
  waitForInteraction: boolean;
  verifyCondition?: () => boolean;
}

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CurrencySettingsDemo: React.FC = () => {
  const ghostCursorRef = useRef<GhostCursor | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elementPositions, setElementPositions] = useState<Record<string, ElementPosition>>({});

  // Define the currency settings workflow with selectors
  const workflowSteps: WorkflowStep[] = [
    {
      elementId: 'home-settings-icon',
      instruction: 'Click the settings icon in the top right corner',
      label: 'Settings',
      selector: '.settings-icon, [data-testid="settings-icon"]',
      waitForInteraction: true,
      verifyCondition: () => document.querySelector('.settings-panel')?.classList.contains('open')
    },
    {
      elementId: 'currency-settings-btn',
      instruction: 'Click on Currency Settings',
      label: 'Currency',
      selector: '.currency-settings-button, [data-testid="currency-settings"]',
      waitForInteraction: true,
      verifyCondition: () => document.querySelector('.currency-dropdown')?.classList.contains('visible')
    },
    {
      elementId: 'currency-dropdown',
      instruction: 'Open the currency dropdown',
      label: 'Select Currency',
      selector: '.currency-dropdown, [data-testid="currency-select"]',
      waitForInteraction: true
    },
    {
      elementId: 'currency-option-cad',
      instruction: 'Select CAD (Canadian Dollar)',
      label: 'CAD',
      selector: '.currency-option-cad, [data-testid="currency-option-cad"]',
      waitForInteraction: true,
      verifyCondition: () => document.querySelector('#selected-currency')?.textContent === 'CAD'
    }
  ];

  // Function to get element position and size
  const getElementPosition = (element: Element): ElementPosition => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  };

  // Function to update all element positions
  const updateElementPositions = () => {
    const positions: Record<string, ElementPosition> = {};
    
    workflowSteps.forEach(step => {
      const element = document.querySelector(step.selector);
      if (element) {
        positions[step.elementId] = getElementPosition(element);
      }
    });

    setElementPositions(positions);
  };

  // Update positions when window resizes
  useEffect(() => {
    if (isPlaying) {
      const handleResize = () => {
        updateElementPositions();
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isPlaying]);

  // Update positions when DOM changes
  useEffect(() => {
    if (isPlaying) {
      const observer = new MutationObserver(updateElementPositions);
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      return () => observer.disconnect();
    }
  }, [isPlaying]);

  const startDemo = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentStepIndex(0);

    // Initial position update
    updateElementPositions();

    ghostCursorRef.current = new GhostCursor({
      color: 'rgba(75, 75, 255, 0.8)',
      size: 24,
      glowColor: 'rgba(75, 75, 255, 0.4)',
      glowSize: 12,
      moveDuration: 1000,
      clickDuration: 200,
      labelStyle: {
        background: '#333',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500'
      }
    });

    await executeWorkflow();
  };

  const executeWorkflow = async () => {
    if (!ghostCursorRef.current || currentStepIndex >= workflowSteps.length) {
      cleanup();
      return;
    }

    const currentStep = workflowSteps[currentStepIndex];
    const position = elementPositions[currentStep.elementId];

    // If element position is not found, try to update positions
    if (!position) {
      updateElementPositions();
      return;
    }
    
    await ghostCursorRef.current.executeAction({
      elementId: currentStep.elementId,
      instruction: currentStep.instruction,
      boundingBox: position
    });

    if (!currentStep.waitForInteraction) {
      setCurrentStepIndex(prev => prev + 1);
      await executeWorkflow();
    }
  };

  const handleElementInteraction = async (elementId: string) => {
    if (!isPlaying || currentStepIndex >= workflowSteps.length) return;

    const currentStep = workflowSteps[currentStepIndex];
    if (currentStep.elementId === elementId) {
      if (currentStep.verifyCondition && !currentStep.verifyCondition()) {
        return; // Wait for the condition to be met
      }
      setCurrentStepIndex(prev => prev + 1);
      await executeWorkflow();
    }
  };

  const cleanup = () => {
    if (ghostCursorRef.current) {
      ghostCursorRef.current.destroy();
      ghostCursorRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setElementPositions({});
  };

  useEffect(() => {
    return cleanup;
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      const elementId = element.id;
      if (elementId) {
        handleElementInteraction(elementId);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [currentStepIndex, isPlaying]);

  return (
    <button
      onClick={startDemo}
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
      {isPlaying ? `Step ${currentStepIndex + 1}/${workflowSteps.length}` : 'Start Currency Demo'}
    </button>
  );
}; 