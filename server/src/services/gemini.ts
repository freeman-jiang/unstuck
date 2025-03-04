import OpenAI from "openai";

export interface InteractiveElement {
  id: string;
  label: string;
  type: string;
}

export interface AnalyzeRequest {
  userQuery: string;
  screenshot: string;
  domString: string;
  previousMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  sitemap: string;
}

export async function processQuery(
  request: AnalyzeRequest,
  apiKey: string
): Promise<{
  result: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
}> {
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  const { userQuery, screenshot, domString, previousMessages, sitemap } =
    request;


    // Important: in the case that your user's query doesn't have enough information for you to assist with, or the user's query doesn't have to do with getting around on the website, you should respond to the question in a patient manner, in which you acknowledge their question, try your best to answer, and try to find more information about the issue. Remember, that doesn't mean use this when you get stuck and you can't find the answer. Only if the users query is very vague or doesn't have enough information to assist with, you should respond with a general response. OTHERWISE YOU WILL DIE.
    // In this case, you should respond with the following JSON format:
    // {
    //   "generalResponse": "A general response to the user's question, in which you acknowledge their question, try your best to answer, and try to find more information about the issue."
    // }
    

  const userMessage = `
You are an AI assistant designed to help users navigate within this specific website. Your task is to understand the user's query and provide step-by-step guidance using the available UI elements on the page. You have access to the following information:

1. A sitemap of the website
2. The DOM structure of the page

Here is the sitemap of the website:
<sitemap>
${sitemap}
</sitemap>

Here is the current DOM structure of the page:
<dom_structure>
${domString}
</dom_structure>

Here is the user's query:
<user_query>
${userQuery}
</user_query>

Your goal is to determine the best sequence of actions to fulfill the user's request. Please follow these steps:

1. Analyze the user's query and the DOM structure.
2. Identify the interactive elements that are most relevant to the user's goal.
3. If there's no direct match for the user's query, plan intermediate steps that would lead to the desired outcome.
4. Determine the sequence of element IDs to interact with (click, input, etc.) to achieve the user's goal.

Wrap your analysis inside <analysis> tags before providing the final output and provide the final output inside <response> tags. In your analysis:
- Map the user's query to specific actions or goals
- Outline potential paths to achieve the goal
- Consider and note any obstacles or intermediate steps

Consider the following:
- How does the user's query relate to the available elements in the DOM?
- What are the possible paths to achieve the user's goal?
- Are there any potential obstacles or intermediate steps required?

After your analysis, provide your response in the following JSON format:

{
  "reasoning": "A detailed explanation of how you determined the action sequence",
  "actions": ["div-div-a-3", "nav-div-a-1", ...] 
  "narration": "A brief, concise, but friendly description of what you're doing for the user. Be enthusiastic and patient!",
  "taskAccomplished": true or false
}

The "reasoning" field should contain your step-by-step explanation of how you arrived at the action sequence. The "actions" field should be an array of 'data-unstuck-id' values from the DOM elements that need to be interacted with, in order. The "narration" field should be a short, user-friendly explanation of what steps you're taking. The "taskAccomplished" field should be true if you believe the user's goal has been achieved, please refer to the screenshot to see what the state of the page is. False otherwise.

Remember:
- It's okay if there's no direct match for the user's query. In such cases, focus on the steps that would most likely lead to the user's final goal.
- Your response should be based solely on the information provided in the user query and DOM structure.
- Keep the narration friendly, but mainly concise and clear. Keep it to the point and don't ramble!
- Don't apologize if you can't immediately find the answer it's normal and expected to have intermediate steps.
- Ensure that your action sequence is logical and achievable given the available elements.
- only set taskAccomplished to true if you are completely done with the user's query, don't set it on the last step. Set it after you have completed the last step.
- ONLY include data-unstuck-id values in the actions array OR YOU WILL DIE.
- DO NOT SAY I'M SORRY I CAN'T FIND THE ANSWER AND GIVE UP OR YOU WILL DIE. You must thoroughly explore and click around the page to find the answer.

Please provide your analysis and response now.
`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    ...previousMessages,
    {
      role: "user",
      content: [
        { type: "text", text: userMessage },
        // {
        //   type: "image_url",
        //   image_url: {
        //     url: screenshot,
        //     detail: "high",
        //   },
        // },
      ],
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: messages,
  });

  if (!completion.choices[0].message.content) {
    throw new Error("No response from Gemini");
  }

  const result = completion.choices[0].message.content;

  const assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
    role: "assistant",
    content: result,
  };

  return {
    result,
    messages: [...messages, assistantMessage],
  };
}
