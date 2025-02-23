import { ChatWidget } from "@/components/unstuck/ChatWidget";
import { takeScreenshot } from "@/utils/screenshot";
import React, { createContext, useContext, useEffect, useState } from "react";

interface InteractiveElement {
  id: string;
  label: string;
  type: string;
  boundingBox?: DOMRect;
}

interface UnstuckContextType {
  interactives: InteractiveElement[];
  userQuery: string | null;
  screenshots: string[];
  reasoningHistory: string[];
  getContext: () => Promise<{
    interactiveElements: InteractiveElement[];
    domString: string;
    screenshot: string;
    screenshots: string[];
    reasoningHistory: string[];
    userQuery: string | null;
  }>;
  setUserQuery: (query: string) => void;
  addScreenshot: (screenshot: string) => void;
  addReasoning: (reasoning: string) => void;
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
    el.hasAttribute("onKeyDown") ||
    el.hasAttribute("onKeyUp")
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

function getDescriptiveId(el: Element): string {
  const type = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  const parentContext = getParentContext(el);
  globalCounter++;
  const baseId = [parentContext, type, role, globalCounter]
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

export function UnstuckProvider({ children }: { children: React.ReactNode }) {
  const [interactives, setInteractives] = useState<InteractiveElement[]>([]);
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [reasoningHistory, setReasoningHistory] = useState<string[]>([]);

  const addScreenshot = (screenshot: string) => {
    setScreenshots((prev) => [...prev, screenshot]);
  };

  const addReasoning = (reasoning: string) => {
    setReasoningHistory((prev) => [...prev, reasoning]);
  };

  const getContext = async () => {
    const domString = document.documentElement.outerHTML;
    const screenshot = await takeScreenshot();
    return {
      interactiveElements: interactives,
      domString,
      screenshot,
      screenshots,
      reasoningHistory,
      userQuery,
    };
  };

  useEffect(() => {
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
    <UnstuckContext.Provider
      value={{
        interactives,
        userQuery,
        screenshots,
        reasoningHistory,
        getContext,
        setUserQuery,
        addScreenshot,
        addReasoning,
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
