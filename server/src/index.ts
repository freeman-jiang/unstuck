import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

// Define environment bindings type
type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware
app.use("/*", cors());

// Initialize OpenAI client in the route handler to access env
interface InteractiveElement {
  id: string;
  label: string;
  type: string; // what kind of element
}

interface AnalyzeRequest {
  userQuery: string;
  screenshot: string;
  domString: string;
  interactiveElements: InteractiveElement[];
}

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Route to analyze user query with multiple modalities
app.post("/analyze", async (c) => {
  console.log("Got request");
  try {
    const openai = new OpenAI({
      apiKey: c.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const { userQuery, screenshot, domString, interactiveElements } =
      await c.req.json<AnalyzeRequest>();

    // Construct the system message
    const systemMessage = `You are an AI assistant helping users navigate a website. 
Your task is to understand the user's query and provide step-by-step guidance using the available UI elements.
You have access to:
1. A screenshot of the current page
2. The DOM structure
3. A list of interactive elements (buttons, links, etc.)

It is possible that you don't find any element that directly matches the user's query. That's okay, navigating a page involves intermediate steps. Please take the step that would be most likely to lead to the user's final goal.`;

    const userMessage = `
You are an AI assistant designed to help users navigate a website. Your task is to understand the user's query and provide step-by-step guidance using the available UI elements on the page. You have access to the following information:

1. A screenshot of the current page (not directly provided in this prompt)
2. The DOM structure of the page
3. A list of interactive elements (buttons, links, etc.) derived from the DOM structure

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
a. Identify and list all relevant interactive elements from the DOM
b. Map the user's query to specific actions or goals
c. Outline potential paths to achieve the goal
d. Consider and note any obstacles or intermediate steps

Consider the following:
- How does the user's query relate to the available elements in the DOM?
- What are the possible paths to achieve the user's goal?
- Are there any potential obstacles or intermediate steps required?

After your analysis, provide your response in the following JSON format:

{
  "reasoning": "A detailed explanation of how you determined the action sequence",
  "actions": ["div-div-a-3", "nav-div-a-1", ...] 
  "narration": "A brief, concise description of what you're doing for the user",
  "taskAccomplished": true or false
}

The "reasoning" field should contain your step-by-step explanation of how you arrived at the action sequence. The "actions" field should be an array of 'data-unstuck-id' values from the DOM elements that need to be interacted with, in order. The "narration" field should be a short, user-friendly explanation of what steps you're taking. The "taskAccomplished" field should be true if you believe the user's goal has been achieved, please refer to the screenshot to see what the state of the page is. False otherwise.

Remember:
- It's okay if there's no direct match for the user's query. In such cases, focus on the steps that would most likely lead to the user's final goal.
- Your response should be based solely on the information provided in the user query and DOM structure.
- Keep the narration concise and clear
- Ensure that your action sequence is logical and achievable given the available elements.
- ONLY include data-unstuck-id values in the actions array OR YOU WILL DIE.

Please provide your analysis and response now.
`;

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      // model: "gemini-2.0-pro-exp-02-05",
      model: "gemini-2.0-flash",
      messages: [
        // {
        //   role: "system",
        //   content: systemMessage,
        // },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            {
              type: "image_url",
              image_url: {
                url: screenshot,
                detail: "high",
              },
            },
          ],
        },
      ],
      // max_tokens: 500,
      // temperature: 0.7,
    });

    // Extract the assistant's response
    const response = completion.choices[0].message.content || "";

    console.log(response);

    // Parse the response and identify UI elements to interact with
    // const steps = {
    //   response,
    //   elements: interactiveElements.filter(
    //     (el: InteractiveElement) =>
    //       response.toLowerCase().includes(el.label.toLowerCase()) ||
    //       response.toLowerCase().includes(el.type.toLowerCase())
    //   ),
    // };

    return c.json(response);
  } catch (error) {
    console.error("Error analyzing query:", error);
    return c.json({ error: "Failed to analyze query" }, 500);
  }
});

export default app;
