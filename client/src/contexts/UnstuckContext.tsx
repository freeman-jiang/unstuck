import { ChatWidget } from "@/components/unstuck/ChatWidget";
import { sanitize as sanitizeDom } from "@/lib/sanitize";
import { takeScreenshot } from "@/utils/screenshot";
import OpenAI from "openai";
import React, { createContext, useContext, useEffect, useState } from "react";

interface InteractiveElement {
  id: string;
  label: string;
  type: string;
  boundingBox: DOMRect;
}

interface UnstuckContextType {
  interactives: InteractiveElement[];

  getCurrentContext: () => Promise<{
    domString: string;
    screenshot: string;
    userQuery: string | null;
  }>;
  previousMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  setUserQuery: (query: string) => void;
  setPreviousMessages: (
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ) => void;
}

const UnstuckContext = createContext<UnstuckContextType | undefined>(undefined);

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
    Array.from(el.attributes).some((attr) => attr.name.startsWith("data-"))
  );
}

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
const mintId = () => {
  return ++globalCounter;
};

function getDescriptiveId(el: Element): string {
  const type = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  const parentContext = getParentContext(el);
  const baseId = [parentContext, type, role, mintId()]
    .filter(Boolean)
    .join("-");
  return baseId;
}

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
    const boundingBox = node.getBoundingClientRect();
    // Only process nodes with valid bounding boxes
    if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
      const unstuckId = mintId().toString();
      node.setAttribute("data-unstuck-id", unstuckId);
      return {
        id: unstuckId,
        label: getElementLabel(node),
        type: node.tagName.toLowerCase(),
        boundingBox,
      };
    }
  }
  return null;
}

export function UnstuckProvider({ children }: { children: React.ReactNode }) {
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [previousMessages, setPreviousMessages] = useState<
    OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  >([]);
  const [interactives, setInteractives] = useState<InteractiveElement[]>([]);
  const getCurrentContext = async () => {
    const rawDomString = document.documentElement.outerHTML;
    const sanitizedDomString = sanitizeDom(rawDomString);

    // Filter out elements that don't have valid bounding boxes
    const validInteractives = interactives
      .filter(
        (el) =>
          el.boundingBox &&
          el.boundingBox.width > 0 &&
          el.boundingBox.height > 0
      )
      .map((el) => ({
        boundingBox: el.boundingBox,
        label: el.label,
        id: el.id,
      }));

    const screenshot = await takeScreenshot(document.body, validInteractives);
    console.log("Took screenshot: ");
    return {
      interactiveElements: interactives,

      domString: sanitizedDomString,
      screenshot,
      userQuery,
    };
  };

  useEffect(() => {
    // Create mutation observer to watch for DOM changes
    const observer = new MutationObserver(async (mutations) => {
      console.log("Mutations detected");
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
      }
    });

    console.log("Initial scan of all existing elements in the DOM");
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
    <UnstuckContext.Provider
      value={{
        interactives,

        getCurrentContext,
        setUserQuery,
        setPreviousMessages,
        previousMessages,
      }}
    >
      {children}
      <ChatWidget />
    </UnstuckContext.Provider>
  );
}

export function useUnstuck() {
  const context = useContext(UnstuckContext);
  if (context === undefined) {
    throw new Error("useUnstuck must be used within a UnstuckProvider");
  }
  return context;
}
