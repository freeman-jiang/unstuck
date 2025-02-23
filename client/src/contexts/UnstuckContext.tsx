// Import required React hooks and types
import { ChatWidget } from "@/components/unstuck/ChatWidget";
import { takeScreenshot } from "@/utils/screenshot";
import React, { createContext, useContext, useEffect, useState } from "react";

// Interface defining the structure of an interactive element
interface InteractiveElement {
  id: string; // Unique identifier
  label: string; // Accessible label
  type: string; // Element type (button, input, etc)
  boundingBox?: DOMRect; // Element's position and dimensions
}

// Interface defining the context structure
interface UnstuckContextType {
  interactives: InteractiveElement[]; // Array of interactive elements
  getContext: () => Promise<{
    interactiveElements: InteractiveElement[];
    domString: string;
    screenshot: string;
  }>;
}

// Create context with undefined default value
const UnstuckContext = createContext<UnstuckContextType | undefined>(undefined);

// Check if an element is interactive based on tags and attributes
function isInteractive(el: Element): boolean {
  const interactiveTags = ["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"];
  const interactiveRoles = [
    "button",
    "link",
    "menuitem",
    "tab",
    "checkbox",
    "radio",
  ];

  return (
    interactiveTags.includes(el.tagName) ||
    interactiveRoles.includes(el.getAttribute("role") || "") ||
    el.hasAttribute("onClick") ||
    el.hasAttribute("onKeyDown") ||
    el.hasAttribute("onKeyUp")
  );
}

// Get accessible label for an element using various attributes
function getElementLabel(el: Element): string {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    el.getAttribute("title") ||
    el.textContent?.trim() ||
    "Unknown"
  );
}

let globalCounter = 0;

function getDescriptiveId(el: Element): string {
  // Get core identifiers
  const type = el.tagName.toLowerCase();
  const role = el.getAttribute("role");

  // Get parent context (e.g., "header-nav-menu-")
  const parentContext = getParentContext(el);

  // Combine identifiers with monotonic ID
  globalCounter++;
  const baseId = [parentContext, type, role, globalCounter]
    .filter(Boolean) // Remove empty values
    .join("-");

  return baseId;
}

// Helper to get parent context
function getParentContext(el: Element, depth = 2): string {
  const parents: string[] = [];
  let current = el.parentElement;

  while (current && parents.length < depth) {
    const identifier =
      current.getAttribute("id") ||
      current.getAttribute("data-testid") ||
      current.getAttribute("role") ||
      current.tagName.toLowerCase();
    if (identifier) parents.unshift(identifier);
    current = current.parentElement;
  }

  return parents.join("-");
}

function processNode(node: Element) {
  if (isInteractive(node)) {
    const unstuckId = getDescriptiveId(node);
    node.setAttribute("data-unstuck-id", unstuckId);
    return {
      id: unstuckId,
      label: getElementLabel(node),
      type: node.tagName.toLowerCase(),
      boundingBox: node.getBoundingClientRect(),
    };
  }
  return null;
}

// Provider component that tracks interactive elements
export function UnstuckProvider({ children }: { children: React.ReactNode }) {
  // State to store all interactive elements
  const [interactives, setInteractives] = useState<InteractiveElement[]>([]);

  console.log("interactives", interactives);

  const getContext = async () => {
    const domString = document.documentElement.outerHTML;
    const screenshot = await takeScreenshot();
    return {
      interactiveElements: interactives,
      domString,
      screenshot,
    };
  };

  useEffect(() => {
    // Initial scan of all existing elements in the DOM
    const elements = document.querySelectorAll("*");
    const interactiveElements: InteractiveElement[] = [];

    elements.forEach((element) => {
      const interactive = processNode(element);
      if (interactive) {
        interactiveElements.push(interactive);
      }
    });

    setInteractives(interactiveElements);
  }, []);

  return (
    <UnstuckContext.Provider value={{ interactives, getContext }}>
      {children}
      <ChatWidget />
    </UnstuckContext.Provider>
  );
}

// Custom hook to access the Unstuck context
export function useUnstuck() {
  const context = useContext(UnstuckContext);
  if (context === undefined) {
    throw new Error("useUnstuck must be used within a UnstuckProvider");
  }
  return context;
}
