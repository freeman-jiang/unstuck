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
    The user query is: ${userQuery}
    The current DOM is: ${domString}
    The interactive elements are: ${JSON.stringify(interactiveElements)}
`;

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-pro-exp-02-05",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
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
