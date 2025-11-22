import './style.css'

// --- Game State Interfaces ---
interface PlayerState {
  position: number;
  money: number;
  treasures: number;
  finished: boolean;
}

interface Tile {
  type: 'treasure' | 'money';
  value: number; // Amount of money or 1 for treasure
  claimed: boolean; // If true, the item has been taken
}

// --- Global State ---
let boardSize: number = 30;
let board: Tile[] = [];
let player: PlayerState = { position: 0, money: 0, treasures: 0, finished: false };
let machine: PlayerState = { position: 0, money: 0, treasures: 0, finished: false };
let gameActive: boolean = false;
let turnCount: number = 0;

// --- DOM Elements ---
const welcomeScreen = document.getElementById('welcome-screen')!;
const gameScreen = document.getElementById('game-screen')!;
const boardSizeInput = document.getElementById('board-size-input') as HTMLInputElement;
const btnStart = document.getElementById('btn-start')!;
const configError = document.getElementById('config-error')!;

const btnMove = document.getElementById('btn-move')!;
const moveInput = document.getElementById('move-input') as HTMLInputElement;
const btnReset = document.getElementById('btn-reset')!;

const logsContainer = document.getElementById('game-logs')!;

// Stats Elements
const els = {
  pPos: document.getElementById('p-pos')!,
  pMoney: document.getElementById('p-money')!,
  pTreasures: document.getElementById('p-treasures')!,
  mPos: document.getElementById('m-pos')!,
  mMoney: document.getElementById('m-money')!,
  mTreasures: document.getElementById('m-treasures')!,
  mRoll: document.getElementById('m-roll')!,
  status: document.getElementById('game-status')!,
  turn: document.getElementById('turn-indicator')!
};

// --- Initialization ---
btnStart.addEventListener('click', () => {
  const size = parseInt(boardSizeInput.value);
  if (isNaN(size) || size < 20 || size > 120) {
    configError.textContent = "Error: El tamaño debe estar entre 20 y 120.";
    return;
  }
  configError.textContent = "";
  startGame(size);
});

btnReset.addEventListener('click', () => {
  gameScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
  log("--- REINICIANDO SISTEMA ---", 'dim');
});

btnMove.addEventListener('click', () => {
  if (!gameActive) return;
  
  const steps = parseInt(moveInput.value);
  if (isNaN(steps) || steps < 1 || steps > 6) {
    log("Error: Movimiento inválido. Ingrese 1-6.", 'error');
    return;
  }
  
  playTurn(steps);
});

// --- Game Logic ---

function startGame(size: number) {
  boardSize = size;
  generateBoard(size);
  
  // Reset State
  player = { position: 0, money: 0, treasures: 0, finished: false };
  machine = { position: 0, money: 0, treasures: 0, finished: false };
  gameActive = true;
  turnCount = 1;
  
  // UI Updates
  welcomeScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  updateStats();
  
  // Clear Logs
  logsContainer.innerHTML = '';
  log("=== INICIALIZANDO JUEGO DE LOS TESOROS ===", 'highlight');
  log(`Tablero generado: ${size} casillas.`, 'dim');
  log(`Tesoros escondidos: ${Math.floor(size * 0.3)}`, 'dim');
  log("Esperando comando del jugador...", 'success');
}

function generateBoard(size: number) {
  board = [];
  const numTreasures = Math.floor(size * 0.3);
  
  // Initialize with money
  for (let i = 0; i < size; i++) {
    board.push({
      type: 'money',
      value: Math.floor(Math.random() * (100 - 10 + 1)) + 10,
      claimed: false
    });
  }
  
  // Place treasures randomly
  let placed = 0;
  while (placed < numTreasures) {
    const idx = Math.floor(Math.random() * size);
    if (board[idx].type !== 'treasure') {
      board[idx] = { type: 'treasure', value: 1, claimed: false };
      placed++;
    }
  }
}

function playTurn(playerSteps: number) {
  log(`\n--- TURNO ${turnCount} ---`, 'highlight');
  
  // 1. Player Move
  if (!player.finished) {
    moveEntity('Jugador', player, playerSteps);
  } else {
    log("Jugador ya llegó al final. Esperando a la máquina...", 'dim');
  }
  
  if (checkGameOver()) return;
  
  // 2. Machine Move
  if (!machine.finished) {
    const machineSteps = Math.floor(Math.random() * 6) + 1;
    els.mRoll.textContent = machineSteps.toString();
    
    // Small delay for realism
    setTimeout(() => {
      moveEntity('Máquina', machine, machineSteps);
      if (!checkGameOver()) {
        turnCount++;
        els.turn.textContent = `Turno ${turnCount}`;
      }
    }, 500);
  } else {
    log("Máquina ya llegó al final.", 'dim');
    if (!checkGameOver()) {
        turnCount++;
        els.turn.textContent = `Turno ${turnCount}`;
    }
  }
}

function moveEntity(name: string, entity: PlayerState, steps: number) {
  const oldPos = entity.position;
  let newPos = oldPos + steps;
  
  if (newPos >= boardSize - 1) {
    newPos = boardSize - 1;
    entity.finished = true;
    log(`${name} ha llegado al final del tablero!`, 'highlight');
  }
  
  entity.position = newPos;
  log(`${name} avanza ${steps} casillas a pos ${newPos}.`);
  
  // Check Tile
  const tile = board[newPos];
  if (tile.claimed) {
    log(`  > Casilla ${newPos} vacía (ya visitada).`, 'dim');
  } else {
    tile.claimed = true;
    if (tile.type === 'treasure') {
      entity.treasures++;
      log(`  > ¡${name} encontró un TESORO! 💎 (${entity.treasures}/3)`, 'success');
    } else {
      entity.money += tile.value;
      log(`  > ${name} encontró $${tile.value}. Total: $${entity.money}`, 'success');
    }
  }
  
  updateStats();
}

function checkGameOver(): boolean {
  let reason = "";
  let over = false;
  
  if (player.treasures >= 3) {
    reason = "Jugador encontró 3 tesoros.";
    over = true;
  } else if (machine.treasures >= 3) {
    reason = "Máquina encontró 3 tesoros.";
    over = true;
  } else if (player.finished && machine.finished) {
    reason = "Ambos llegaron al final.";
    over = true;
  }
  
  if (over) {
    endGame(reason);
    return true;
  }
  return false;
}

function endGame(reason: string) {
  gameActive = false;
  log(`\n=== JUEGO TERMINADO: ${reason} ===`, 'highlight');
  
  let winner = "";
  let totalPot = player.money + machine.money;
  
  if (player.money > machine.money) {
    winner = "JUGADOR";
  } else if (machine.money > player.money) {
    winner = "MÁQUINA";
  } else {
    // Tie break by treasures
    if (player.treasures > machine.treasures) {
      winner = "JUGADOR (por tesoros)";
    } else if (machine.treasures > player.treasures) {
      winner = "MÁQUINA (por tesoros)";
    } else {
      winner = "EMPATE";
    }
  }
  
  log(`Dinero Jugador: $${player.money} | Tesoros: ${player.treasures}`);
  log(`Dinero Máquina: $${machine.money} | Tesoros: ${machine.treasures}`);
  log(`--------------------------------`);
  
  if (winner === "EMPATE") {
    log(`¡ES UN EMPATE! Nadie se lleva el pozo.`, 'highlight');
    els.status.textContent = "EMPATE";
  } else {
    log(`¡GANADOR: ${winner}! ��`, 'success');
    log(`Premio total acumulado: $${totalPot}`, 'success');
    els.status.textContent = `GANADOR: ${winner}`;
  }
}

function updateStats() {
  els.pPos.textContent = player.position.toString();
  els.pMoney.textContent = player.money.toString();
  els.pTreasures.textContent = player.treasures.toString();
  
  els.mPos.textContent = machine.position.toString();
  els.mMoney.textContent = machine.money.toString();
  els.mTreasures.textContent = machine.treasures.toString();
  
  els.status.textContent = gameActive ? "EN PROGRESO" : "FINALIZADO";
  els.turn.textContent = `Turno ${turnCount}`;
}

function log(msg: string, type: 'normal' | 'success' | 'error' | 'dim' | 'highlight' = 'normal') {
  const div = document.createElement('div');
  div.className = `code-line ${type}`;
  div.textContent = `> ${msg}`;
  logsContainer.appendChild(div);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}
