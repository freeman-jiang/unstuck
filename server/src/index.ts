import { Hono } from "hono";
import OpenAI from "openai";

// Define environment bindings type
type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Initialize OpenAI client in the route handler to access env
interface InteractiveElement {
  id: string;
  label: string;
  type: string; // what kind of element
}

interface AnalyzeRequest {
  userQuery: string;
  screenshot: string;
  dom: string;
  interactiveElements: InteractiveElement[];
}

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Route to analyze user query with multiple modalities
app.post("/analyze", async (c) => {
  try {
    const openai = new OpenAI({
      apiKey: c.env.GEMINI_API_KEY,
    });

    const { userQuery, screenshot, dom, interactiveElements } =
      await c.req.json<AnalyzeRequest>();

    // Construct the system message
    const systemMessage = `You are an AI assistant helping users navigate a website. 
Your task is to understand the user's query and provide step-by-step guidance using the available UI elements.
You have access to:
1. A screenshot of the current page
2. The DOM structure
3. A list of interactive elements (buttons, links, etc.)

Analyze these to provide the most accurate navigation assistance.

The user query is: ${userQuery}
The DOM is: ${dom}
The interactive elements are: ${JSON.stringify(interactiveElements)}`;

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userQuery },
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
      max_tokens: 500,
      temperature: 0.7,
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
