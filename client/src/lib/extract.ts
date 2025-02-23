export const parseGemini = (response: string) => {
  try {
    const match = response.match(/<response>\s*(.*?)\s*<\/response>/s);
    if (!match) return null;

    let jsonStr = match[1];
    // Strip out json code blocks if present
    jsonStr = jsonStr.replace(/```json\s*([\s\S]*?)\s*```/g, "$1");

    const json = JSON.parse(jsonStr);
    return {
      reasoning: json.reasoning,
      actions: json.actions,
      narration: json.narration,
      taskAccomplished: json.taskAccomplished,
    };
  } catch (e) {
    return null;
  }
};
