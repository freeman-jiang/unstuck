import { Hono } from "hono";
import { cors } from "hono/cors";
import { analyzeQuery, type AnalyzeRequest } from "./services/gemini";

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

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Route to analyze user query with multiple modalities
app.post("/analyze", async (c) => {
  try {
    const request = await c.req.json<AnalyzeRequest>();
    const response = await analyzeQuery(request, c.env.GEMINI_API_KEY);
    return c.json(response);
  } catch (error) {
    console.error("Error analyzing query:", error);
    return c.json({ error: "Failed to analyze query" }, 500);
  }
});

export default app;
