import "./style.css";
import { MIPS } from "@specy/mips";

// Function to generate MIPS code with dynamic n value
function generateFibonacciCode(n: number): string {
  return `
.data
  prompt: .asciiz "Fibonacci(${n}) = "
  newline: .asciiz "\\n"
  
.text
main:
  # Print prompt
  li $v0, 4
  la $a0, prompt
  syscall
  
  # Calculate fibonacci(${n})
  li $a0, ${n}
  jal fibonacci
  
  # Print result
  move $a0, $v0
  li $v0, 1
  syscall
  
  # Print newline
  li $v0, 4
  la $a0, newline
  syscall
  
  # Exit
  li $v0, 10
  syscall

# Recursive fibonacci function
# Input: $a0 = n
# Output: $v0 = fib(n)
fibonacci:
  # Base case: if n <= 1, return n
  slti $t0, $a0, 2
  beq $t0, $zero, fib_recursive
  move $v0, $a0
  jr $ra

fib_recursive:
  # Save registers
  addi $sp, $sp, -12
  sw $ra, 8($sp)
  sw $s0, 4($sp)
  sw $s1, 0($sp)
  
  # Save n
  move $s0, $a0
  
  # Calculate fib(n-1)
  addi $a0, $s0, -1
  jal fibonacci
  move $s1, $v0
  
  # Calculate fib(n-2)
  addi $a0, $s0, -2
  jal fibonacci
  
  # Result = fib(n-1) + fib(n-2)
  add $v0, $s1, $v0
  
  # Restore registers
  lw $s1, 0($sp)
  lw $s0, 4($sp)
  lw $ra, 8($sp)
  addi $sp, $sp, 12
  
  jr $ra
`;
}

// Run MIPS Fibonacci simulator
function runFibonacci(n: number) {
  const mipsOutput = document.getElementById("mipsOutput");

  if (!mipsOutput) return;

  try {
    const code = generateFibonacciCode(n);
    const mips = MIPS.makeMipsFromSource(code);

    mipsOutput.textContent = "";
    mipsOutput.textContent += `Ejecutando Fibonacci(${n})...\n\n`;

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

    // Execute the program with a higher limit for recursive algorithms
    const startTime = performance.now();
    const terminated = mips.simulateWithLimit(10000000);
    const endTime = performance.now();

    mipsOutput.textContent += `\n\nEstado: ${
      terminated ? "Completado" : "Límite alcanzado"
    }\n`;
    mipsOutput.textContent += `Tiempo de ejecución: ${(
      endTime - startTime
    ).toFixed(2)}ms\n`;
    mipsOutput.textContent += `Instrucciones ejecutadas en el simulador\n`;
  } catch (error) {
    mipsOutput.textContent = "Error: " + (error as Error).message;
    console.error(error);
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized");

  // Run Fibonacci on load
  const fibInput = document.getElementById("fibInput") as HTMLInputElement;
  if (fibInput) {
    runFibonacci(parseInt(fibInput.value));
  }

  // Setup Fibonacci controls
  const runFibBtn = document.getElementById("runFibonacci");
  const clearBtn = document.getElementById("clearOutput");

  if (runFibBtn && fibInput) {
    runFibBtn.addEventListener("click", () => {
      const n = parseInt(fibInput.value);
      if (n >= 0 && n <= 30) {
        runFibonacci(n);
      } else {
        alert("Por favor ingresa un número entre 0 y 30");
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const mipsOutput = document.getElementById("mipsOutput");
      if (mipsOutput) {
        mipsOutput.textContent = "";
      }
    });
  }

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
