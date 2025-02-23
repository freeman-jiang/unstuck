export const sanitize = (domString: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(domString, "text/html");
  const chatWidget = doc.getElementById("chat-widget");
  if (chatWidget) {
    chatWidget.remove();
  }
  return doc.documentElement.outerHTML;
};
