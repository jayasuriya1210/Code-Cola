import React, { useState } from "react";

function App() {
  const [num, setNum] = useState("");

  return (
    <div>
      <h2>Odd or Even</h2>
      <input
        type="number"
        placeholder="Enter number"
        value={num}
        onChange={(e) => setNum(e.target.value)}
      />
      {num !== "" && (
        <h3>
          {num % 2 === 0 ? "Even" : "Odd"}
        </h3>
      )}
    </div>
  );
}

export default App;