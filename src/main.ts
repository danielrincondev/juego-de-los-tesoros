import './style.css'
import { Mips } from '@specy/mips'

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
`

// Test the MIPS simulator
function testMipsSimulator() {
  const mipsOutput = document.getElementById('mipsOutput')
  
  if (!mipsOutput) return
  
  try {
    // Create a new MIPS instance
    const mips = new Mips()
    
    // Parse and load the code
    mips.loadCode(simpleMipsCode)
    
    mipsOutput.textContent = 'MIPS Simulator initialized successfully!\n\n'
    mipsOutput.textContent += 'Test Code:\n' + simpleMipsCode + '\n\n'
    
    // Try to run the code
    mipsOutput.textContent += 'Running test...\n'
    
    // Execute the program
    const result = mips.run()
    
    mipsOutput.textContent += 'Execution completed!\n'
    mipsOutput.textContent += 'Result: ' + JSON.stringify(result, null, 2)
    
  } catch (error) {
    mipsOutput.textContent = 'Error: ' + (error as Error).message
    console.error(error)
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized')
  
  // Test MIPS simulator on load
  testMipsSimulator()
  
  // Setup event listeners
  const startGameBtn = document.getElementById('startGame')
  const movePlayerBtn = document.getElementById('movePlayer')
  const moveMachineBtn = document.getElementById('moveMachine')
  
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      console.log('Start game clicked')
      alert('Game initialization will be implemented with full MIPS code')
    })
  }
  
  if (movePlayerBtn) {
    movePlayerBtn.addEventListener('click', () => {
      console.log('Move player clicked')
    })
  }
  
  if (moveMachineBtn) {
    moveMachineBtn.addEventListener('click', () => {
      console.log('Move machine clicked')
    })
  }
})

