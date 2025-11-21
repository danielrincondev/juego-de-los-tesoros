import "./style.css";
import { MIPS } from "@specy/mips";

// Simple MIPS test code
const simpleMipsCode = `
.data
  msg: .asciiz "Hello from MIPS!\\n"
  
.text
main:
  # Print message
  li $v0, 4
  la $a0, msg
  syscall
  
  # Exit
  li $v0, 10
  syscall
`;

// Test the MIPS simulator
function testMipsSimulator() {
  const mipsOutput = document.getElementById("mipsOutput");

  if (!mipsOutput) return;

  try {
    // Create MIPS simulator from source using the static method
    const mips = MIPS.makeMipsFromSource(simpleMipsCode);

    mipsOutput.textContent = "MIPS Simulator initialized successfully!\n\n";
    mipsOutput.textContent += "Test Code:\n" + simpleMipsCode + "\n\n";

    // Register handlers for syscalls
    mips.registerHandler("printString", (s: string) => {
      mipsOutput.textContent += s;
    });

    mips.registerHandler("printChar", (c: string) => {
      mipsOutput.textContent += c;
    });

    mips.registerHandler("printInt", (i: number) => {
      mipsOutput.textContent += i.toString();
    });

    mips.registerHandler("log", (message: string) => {
      mipsOutput.textContent += message;
    });

    mips.registerHandler("logLine", (message: string) => {
      mipsOutput.textContent += message + "\n";
    });

    // Assemble the program
    mips.assemble();

    // Initialize (start at main)
    mips.initialize(true);

    mipsOutput.textContent += "Running test...\n";

    // Execute the program with a limit to prevent infinite loops
    const terminated = mips.simulateWithLimit(1000);

    mipsOutput.textContent += "Execution completed!\n";
    mipsOutput.textContent += `Terminated: ${terminated}\n`;
    mipsOutput.textContent += `Program Counter: ${mips.programCounter}\n`;
    mipsOutput.textContent += `$v0: ${mips.getRegisterValue("$v0")}\n`;
  } catch (error) {
    mipsOutput.textContent = "Error: " + (error as Error).message;
    console.error(error);
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized");

  // Test MIPS simulator on load
  testMipsSimulator();

  // Setup event listeners
  const startGameBtn = document.getElementById("startGame");
  const movePlayerBtn = document.getElementById("movePlayer");
  const moveMachineBtn = document.getElementById("moveMachine");

  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      console.log("Start game clicked");
      alert("Game initialization will be implemented with full MIPS code");
    });
  }

  if (movePlayerBtn) {
    movePlayerBtn.addEventListener("click", () => {
      console.log("Move player clicked");
    });
  }

  if (moveMachineBtn) {
    moveMachineBtn.addEventListener("click", () => {
      console.log("Move machine clicked");
    });
  }
});
