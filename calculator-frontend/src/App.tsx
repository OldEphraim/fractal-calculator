import { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleButtonClick = (value: string) => {
    if (value === "=") {
      calculateResult();
    } else if (value === "C") {
      setInput("");
      setResult("");
      setError("");
    } else {
      setInput((prev) => prev + value);
    }
  };

  const calculateResult = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expression: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred");
        setResult("");
      } else {
        setResult(data.result.toString());
        setError("");
      }
    } catch (err) {
      console.error("Error during API call:", err);
      setError("Failed to connect to the server");
      setResult("");
    }
  };

  const buttons = [
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "(",
    ")",
    "+",
    "C",
    "=",
  ];

  return (
    <div className="calculator">
      <div className="display">
        <div className="input">{input}</div>
        <div className="result">{result}</div>
        <div className="error">{error}</div>
      </div>
      <div className="buttons">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleButtonClick(btn)}
            className={`button ${btn === "=" ? "equals" : ""}`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
