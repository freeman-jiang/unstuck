import { ChatWidget } from "@/components/unstuck/ChatWidget";
import { sanitize as sanitizeDom } from "@/lib/sanitize";
import { takeScreenshot } from "@/utils/screenshot";
import OpenAI from "openai";
import React, { createContext, useContext, useEffect, useState } from "react";

interface InteractiveElement {
  id: string;
  label: string;
  type: string;
  boundingBox?: DOMRect;
}

interface UnstuckContextType {
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
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [previousMessages, setPreviousMessages] = useState<
    OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  >([]);

  const getCurrentContext = async () => {
    const rawDomString = document.documentElement.outerHTML;
    const sanitizedDomString = sanitizeDom(rawDomString);
    const screenshot = await takeScreenshot();
    console.log("Took screenshot: ");
    return {
      domString: sanitizedDomString,
      screenshot,
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
  }, []);

  return (
    <UnstuckContext.Provider
      value={{
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
