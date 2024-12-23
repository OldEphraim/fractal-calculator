import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["POST"],
};
app.use(cors(corsOptions));
app.use(express.json());

const preprocessAndTokenize = (expression: string): (string | number)[] => {
  if (!expression) throw new Error("Expression cannot be empty");

  console.log(`Starting preprocessing and tokenizing for: "${expression}"`);

  const tokens: (string | number)[] = [];
  let currentNumber = ""; // Accumulate multi-digit numbers or decimals
  let lastChar = ""; // Track the last processed character

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    console.log(
      `Processing char: "${char}" | Current tokens: ${JSON.stringify(tokens)}`
    );

    // Add implicit multiplication before "("
    if (char === "(" && lastChar && (/\d/.test(lastChar) || lastChar === ")")) {
      console.log(`Adding implicit multiplication before "("`);
      tokens.push("*");
    }

    // Add implicit multiplication after ")"
    if (
      char === ")" &&
      i + 1 < expression.length &&
      /\d/.test(expression[i + 1])
    ) {
      console.log(`Adding implicit multiplication after ")"`);
      tokens.push(")");
      tokens.push("*");
      lastChar = char;
      continue; // Skip adding ")" again
    }

    // Accumulate numbers (including decimals)
    if (!isNaN(Number(char)) || char === ".") {
      console.log(`Accumulating number: "${char}"`);
      currentNumber += char;
    } else {
      // If a number has been accumulated, push it to tokens
      if (currentNumber) {
        console.log(`Pushing accumulated number: ${currentNumber}`);
        tokens.push(parseFloat(currentNumber));
        currentNumber = "";
      }

      // Treat leading "+" or "-" as part of a number
      if (
        (char === "-" || char === "+") &&
        (!lastChar || /[+\-*/(]/.test(lastChar))
      ) {
        console.log(`Treating "${char}" as part of a number`);
        currentNumber = char; // Start a new number
        lastChar = char;
        continue; // Skip adding to tokens for now
      }

      // Validate invalid start of the expression
      if (i === 0 && !(/[+-]/.test(char) || char === "(" || /\d/.test(char))) {
        console.error(`Invalid expression beginning at: "${char}"`);
        throw new Error("Invalid expression beginning");
      }

      // Validate invalid end of the expression
      if (i === expression.length - 1 && !/[)\d]/.test(char)) {
        console.error(`Invalid expression ending at: "${char}"`);
        throw new Error("Invalid expression ending");
      }

      // Validate invalid operator sequences
      if (/[*/]/.test(char) && /[+\-*/]/.test(lastChar)) {
        console.error(`Invalid operator sequence: "${lastChar}${char}"`);
        throw new Error("Invalid expression");
      }

      // Push operators and parentheses as tokens
      if (char.trim()) {
        console.log(`Pushing operator/parenthesis: "${char}"`);
        tokens.push(char);
      }
    }

    // Update lastChar
    lastChar = char;
  }

  // If a number has been accumulated at the end, push it
  if (currentNumber) {
    console.log(`Pushing final accumulated number: ${currentNumber}`);
    tokens.push(parseFloat(currentNumber));
  }

  console.log(`Final tokens: ${JSON.stringify(tokens)}`);
  return tokens;
};

const evaluateExpression = (expression: string): number => {
  // Step 1: Preprocess and tokenize the expression
  const tokens = preprocessAndTokenize(expression);

  // Step 2: Evaluate tokens with parentheses
  while (tokens.includes("(")) {
    const start = tokens.lastIndexOf("(");
    const end = tokens.indexOf(")", start);

    if (end === -1) throw new Error("Mismatched parentheses");

    // Extract the inner expression between the parentheses
    const innerTokens = tokens.slice(start + 1, end);
    const value = evaluateSimpleTokens(innerTokens); // Evaluate the inner tokens

    // Replace the parenthetical expression with its value
    tokens.splice(start, end - start + 1, value);
  }

  // Step 3: Evaluate the remaining tokens
  return evaluateSimpleTokens(tokens);
};

const evaluateSimpleTokens = (tokens: (string | number)[]): number => {
  // Handle multiplication and division
  const multiplyDivide: (string | number)[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "*" || token === "/") {
      const a = multiplyDivide.pop() as number;
      const b = tokens[++i] as number;
      if (token === "*") {
        multiplyDivide.push(a * b);
      } else {
        if (b === 0) throw new Error("Division by zero");
        multiplyDivide.push(a / b);
      }
    } else {
      multiplyDivide.push(token);
    }
  }

  // Handle addition and subtraction
  let result = multiplyDivide[0] as number;
  for (let i = 1; i < multiplyDivide.length; i += 2) {
    const operator = multiplyDivide[i];
    const operand = multiplyDivide[i + 1] as number;
    if (operator === "+") {
      result += operand;
    } else if (operator === "-") {
      result -= operand;
    }
  }

  return result;
};

app.post(
  "/api/calculate",
  async (req: Request, res: Response): Promise<void> => {
    const { expression } = req.body;

    if (!expression || typeof expression !== "string") {
      res.status(400).json({ error: "Invalid or missing expression" });
      return;
    }

    try {
      const result = evaluateExpression(expression);
      res.json({ result });
    } catch (err: any) {
      console.error("Calculation error:", err.message);
      res.status(400).json({ error: err.message });
    }
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
