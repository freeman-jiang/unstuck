export const parseGemini = (response: string) => {
  try {
    const match = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!match) return null;

    const json = JSON.parse(match[1]);
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
