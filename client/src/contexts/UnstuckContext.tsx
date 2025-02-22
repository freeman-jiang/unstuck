// Import required React hooks and types
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

// Generate a sequential ID based on element type
const counters = new Map<string, number>();

function generateSequentialId(el: Element): string {
  const type = el.tagName.toUpperCase();
  const count = (counters.get(type) || 0) + 1;
  counters.set(type, count);
  return `${type}-${count}`;
}

// Provider component that tracks interactive elements
export function UnstuckProvider({ children }: { children: React.ReactNode }) {
  // State to store all interactive elements
  const [interactives, setInteractives] = useState<InteractiveElement[]>([]);
  console.log(interactives);
  const domString = document.documentElement.outerHTML;

  useEffect(() => {
    // Process a single node to check if it's interactive
    const processNode = (node: Element) => {
      if (isInteractive(node)) {
        const id = node.id || generateSequentialId(node);
        if (!node.id) {
          node.id = id;
        }

        return {
          id,
          label: getElementLabel(node),
          type: node.tagName.toLowerCase(),
          boundingBox: node.getBoundingClientRect(),
        };
      }
      return null;
    };

    // Create mutation observer to watch for DOM changes
    const observer = new MutationObserver(async (mutations) => {
      const newElements: InteractiveElement[] = [];

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const interactive = processNode(element);
            if (interactive) {
              newElements.push(interactive);
            }

            // Recursively check all children of added nodes
            element.querySelectorAll("*").forEach((child) => {
              const childInteractive = processNode(child);
              if (childInteractive) {
                newElements.push(childInteractive);
              }
            });
          }
        });
      });

      // Update state with new unique elements
      if (newElements.length > 0) {
        setInteractives((prev) => {
          const uniqueElements = newElements.filter(
            (newEl) => !prev.some((prevEl) => prevEl.id === newEl.id)
          );
          return [...prev, ...uniqueElements];
        });

        // Take screenshot of screen
        const screenshot = await takeScreenshot();
        console.log("Screenshot", screenshot);
      }
    });

    // Initial scan of all existing elements in the DOM
    document.querySelectorAll("*").forEach((element) => {
      const interactive = processNode(element);
      if (interactive) {
        setInteractives((prev) => {
          if (!prev.some((el) => el.id === interactive.id)) {
            return [...prev, interactive];
          }
          return prev;
        });
      }
    });

    // Start observing DOM mutations
    observer.observe(document.body, {
      childList: true, // Watch for added/removed nodes
      subtree: true, // Watch all descendants
      attributes: true, // Watch for attribute changes
      attributeFilter: ["role", "aria-label", "placeholder", "onClick"],
    });

    // Cleanup: disconnect observer when component unmounts
    return () => observer.disconnect();
  }, []);

  return (
    <UnstuckContext.Provider value={{ interactives }}>
      {children}
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
