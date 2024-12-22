import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173", // Replace with your frontend URL
  methods: ["POST"],
};
app.use(cors(corsOptions));
app.use(express.json());

type Operation = "add" | "subtract" | "multiply" | "divide";

interface CalculateRequestBody {
  num1: number;
  num2: number;
  operation: Operation;
}

// Define routes
app.post(
  "/api/calculate",
  async (
    req: Request<{}, {}, CalculateRequestBody>,
    res: Response
  ): Promise<void> => {
    const { num1, num2, operation } = req.body;

    // Validation
    if (
      num1 === undefined ||
      num2 === undefined ||
      typeof num1 !== "number" ||
      typeof num2 !== "number"
    ) {
      res.status(400).json({ error: "Inputs must be numbers" });
      return;
    }

    if (!["add", "subtract", "multiply", "divide"].includes(operation)) {
      res.status(400).json({ error: "Invalid operation" });
      return;
    }

    if (operation === "divide" && num2 === 0) {
      res.status(400).json({ error: "Division by zero is not allowed" });
      return;
    }

    let result: number;
    switch (operation) {
      case "add":
        result = num1 + num2;
        break;
      case "subtract":
        result = num1 - num2;
        break;
      case "multiply":
        result = num1 * num2;
        break;
      case "divide":
        result = num1 / num2;
        break;
      default:
        res.status(400).json({ error: "Unsupported operation" });
        return;
    }

    res.json({ result });
  }
);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
