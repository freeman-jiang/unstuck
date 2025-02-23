export const parseGemini = (response: string) => {
  try {
    // Try to extract content from <response> tags
    const responseTagMatch = response.match(
      /<response>\s*(.*?)\s*<\/response>/s
    );
    if (responseTagMatch) {
      const contentInsideTags = responseTagMatch[1];
      return parseJsonContent(contentInsideTags);
    }

    // If no response tags, look for raw JSON object by curly braces
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const rawJson = jsonMatch[0];
    return parseJsonContent(rawJson);
  } catch (e) {
    return null;
  }
};

const parseJsonContent = (jsonStr: string) => {
  // Strip out json code blocks if present
  const cleanJson = jsonStr.replace(/```json\s*([\s\S]*?)\s*```/g, "$1");
  const json = JSON.parse(cleanJson);

  return {
    reasoning: json.reasoning,
    actions: json.actions,
    narration: json.narration,
    taskAccomplished: json.taskAccomplished,
  };
};
