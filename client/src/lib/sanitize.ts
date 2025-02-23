export const sanitizeDom = (domString: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(domString, "text/html");
  
  // Remove chat widget
  const chatWidget = doc.getElementById("chat-widget");
  if (chatWidget) {
    chatWidget.remove();
  }

  // Remove all style tags
  const styleTags = doc.getElementsByTagName("style");
  while (styleTags.length > 0) {
    styleTags[0].remove();
  }

  return doc.documentElement.outerHTML;
};
