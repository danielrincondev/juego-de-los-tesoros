import "./style.css";
import { MIPS } from "@specy/mips";
import { mipsCode } from "./mips-code";

let mips: any = null;

function initMips() {
  mips = MIPS.makeMipsFromSource(mipsCode);
  mips.assemble();
  mips.initialize(true);
  runMipsUntilWait();
}

function runMipsUntilWait() {
  if (!mips) return;
  let steps = 0;
  while (steps < 200000) {
    const done = mips.step();
    if (done) break;

    if (mips.getRegisterValue("$v0") === 0) {
      break;
    }
    steps++;
  }
}

function sendCommand(cmd: number, arg0: number = 0) {
  if (!mips) return;
  mips.setRegisterValue("$a0", arg0);
  mips.setRegisterValue("$v0", cmd);
  runMipsUntilWait();
}

const mipsDisplay = document.getElementById("mips-code-display");
if (mipsDisplay) {
  const lines = mipsCode.split("\n");
  mipsDisplay.innerHTML = lines
    .map((line) => {
      let className = "code-line";
      if (line.trim().startsWith("#")) className += " dim";
      if (line.includes(":")) className += " highlight";
      return `<div class="${className}">${line}</div>`;
    })
    .join("");
}

interface PlayerState {
  position: number;
  money: number;
  treasures: number;
  finished: boolean;
  visited: number[];
}

let boardSize: number = 30;
let initialBoard: number[] = [];
let player: PlayerState = {
  position: 0,
  money: 0,
  treasures: 0,
  finished: false,
  visited: [0],
};
let machine: PlayerState = {
  position: 0,
  money: 0,
  treasures: 0,
  finished: false,
  visited: [0],
};
let gameActive: boolean = false;
let turnCount: number = 0;

const welcomeScreen = document.getElementById("welcome-screen")!;
const gameScreen = document.getElementById("game-screen")!;
const boardSizeInput = document.getElementById(
  "board-size-input"
) as HTMLInputElement;
const btnStart = document.getElementById("btn-start")!;
const configError = document.getElementById("config-error")!;

const btnMove = document.getElementById("btn-move")!;
const moveInput = document.getElementById("move-input") as HTMLInputElement;
const btnReset = document.getElementById("btn-reset")!;
const appLogo = document.getElementById("app-logo")!;

const logsContainer = document.getElementById("game-logs")!;

const els = {
  pPos: document.getElementById("p-pos")!,
  pMoney: document.getElementById("p-money")!,
  pTreasures: document.getElementById("p-treasures")!,
  mPos: document.getElementById("m-pos")!,
  mMoney: document.getElementById("m-money")!,
  mTreasures: document.getElementById("m-treasures")!,
  mRoll: document.getElementById("m-roll")!,
  status: document.getElementById("game-status")!,
  turn: document.getElementById("turn-indicator")!,
};

btnStart.addEventListener("click", () => {
  const size = parseInt(boardSizeInput.value);
  if (isNaN(size) || size < 20 || size > 120) {
    configError.textContent = "Error: El tamaño debe estar entre 20 y 120.";
    return;
  }
  configError.textContent = "";
  startGame(size);
});

btnReset.addEventListener("click", () => {
  gameScreen.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");
  if (btnTeam) btnTeam.textContent = "EQUIPO";
  log("--- REINICIANDO SISTEMA ---", "dim");
});

appLogo.addEventListener("click", () => {
  gameScreen.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");
  if (btnTeam) btnTeam.textContent = "EQUIPO";
  log("--- REINICIANDO SISTEMA ---", "dim");
});

btnMove.addEventListener("click", () => {
  if (!gameActive) return;

  const steps = parseInt(moveInput.value);
  if (isNaN(steps) || steps < 1 || steps > 6) {
    log("Error: Movimiento inválido. Ingrese 1-6.", "error");
    return;
  }

  playTurn(steps);
});

function startGame(size: number) {
  boardSize = size;

  player.visited = [0];
  machine.visited = [0];
  player.finished = false;
  machine.finished = false;

  initMips();
  sendCommand(1, size);

  captureInitialBoard();

  updateFromMips();

  gameActive = true;
  turnCount = 1;

  welcomeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  if (btnTeam) btnTeam.textContent = "REINICIAR";
  updateStats();

  logsContainer.innerHTML = "";
  log("=== INICIALIZANDO JUEGO DE LOS TESOROS (MIPS) ===", "highlight");
  log(`Tablero generado: ${size} casillas.`, "dim");
  log("Esperando comando del jugador...", "success");
}

function captureInitialBoard() {
  if (!mips) return;
  const size = boardSize;
  const baseAddr = mips.getRegisterValue("$s7");
  const bytes = mips.readMemoryBytes(baseAddr, size * 4);

  initialBoard = [];
  for (let i = 0; i < size; i++) {
    let val =
      bytes[i * 4] |
      (bytes[i * 4 + 1] << 8) |
      (bytes[i * 4 + 2] << 16) |
      (bytes[i * 4 + 3] << 24);
    if (val > 2147483647) val = val - 4294967296;
    initialBoard.push(val);
  }
}

function playTurn(playerSteps: number) {
  log(`\n--- TURNO ${turnCount} ---`, "highlight");

  if (!player.finished) {
    const oldMoney = player.money;
    const oldTreasures = player.treasures;

    sendCommand(2, playerSteps);
    updateFromMips();

    log(`Jugador avanza ${playerSteps} casillas a pos ${player.position}.`);

    if (player.position >= boardSize - 1) {
      log(`Jugador ha llegado al final del tablero!`, "highlight");
      player.finished = true;
    }

    if (player.treasures > oldTreasures) {
      log(
        `  > ¡Jugador encontró un TESORO! 💎 (${player.treasures}/3)`,
        "success"
      );
    } else if (player.money > oldMoney) {
      log(
        `  > Jugador encontró $${player.money - oldMoney}. Total: $${
          player.money
        }`,
        "success"
      );
    } else {
      log(`  > Casilla vacía o ya visitada.`, "dim");
    }
  } else {
    log("Jugador ya llegó al final. Esperando a la máquina...", "dim");
  }

  if (checkGameOver()) return;

  if (!machine.finished) {
    sendCommand(3);
    const roll = mips.getRegisterValue("$v1");
    els.mRoll.textContent = roll.toString();

    const oldMoney = machine.money;
    const oldTreasures = machine.treasures;

    updateFromMips();

    setTimeout(() => {
      log(`Máquina lanza dado: ${roll}`);
      log(`Máquina avanza ${roll} casillas a pos ${machine.position}.`);

      if (machine.position >= boardSize - 1) {
        log(`Máquina ha llegado al final del tablero!`, "highlight");
        machine.finished = true;
      }

      if (machine.treasures > oldTreasures) {
        log(
          `  > ¡Máquina encontró un TESORO! 💎 (${machine.treasures}/3)`,
          "success"
        );
      } else if (machine.money > oldMoney) {
        log(
          `  > Máquina encontró $${machine.money - oldMoney}. Total: $${
            machine.money
          }`,
          "success"
        );
      } else {
        log(`  > Casilla vacía o ya visitada.`, "dim");
      }

      if (!checkGameOver()) {
        turnCount++;
        els.turn.textContent = `Turno ${turnCount}`;
      }
    }, 500);
  } else {
    log("Máquina ya llegó al final.", "dim");
    if (!checkGameOver()) {
      turnCount++;
      els.turn.textContent = `Turno ${turnCount}`;
    }
  }
}

function updateFromMips() {
  if (!mips) return;
  const newPPos = mips.getRegisterValue("$s0");
  player.position = newPPos;
  if (!player.visited.includes(newPPos)) player.visited.push(newPPos);

  player.money = mips.getRegisterValue("$s1");
  player.treasures = mips.getRegisterValue("$s2");

  const newMPos = mips.getRegisterValue("$s3");
  machine.position = newMPos;
  if (!machine.visited.includes(newMPos)) machine.visited.push(newMPos);

  machine.money = mips.getRegisterValue("$s4");
  machine.treasures = mips.getRegisterValue("$s5");

  if (player.position >= boardSize - 1) player.finished = true;
  if (machine.position >= boardSize - 1) machine.finished = true;

  updateStats();
  renderBoard();
}

function renderBoard() {
  const boardContainer = document.getElementById("board-visual");
  if (!boardContainer || !mips) return;

  const size = boardSize;
  const baseAddr = mips.getRegisterValue("$s7");
  const pPos = player.position;
  const mPos = machine.position;

  const bytes = mips.readMemoryBytes(baseAddr, size * 4);

  let html = "";
  for (let i = 0; i < size; i++) {
    let val =
      bytes[i * 4] |
      (bytes[i * 4 + 1] << 8) |
      (bytes[i * 4 + 2] << 16) |
      (bytes[i * 4 + 3] << 24);

    let content = "";
    let classes = "board-cell";

    if (val === 0) {
      const original = initialBoard[i];
      if (original === -1) {
        content = "💎";
        classes += " treasure-text";
      } else {
        content = "$";
        classes += " money-text";
      }
    } else {
      content = "?";
    }

    if (i === pPos && i === mPos) {
      classes += " both-bg current-pos";
    } else if (i === pPos) {
      classes += " player-bg current-pos";
    } else if (i === mPos) {
      classes += " machine-bg current-pos";
    } else if (player.visited.includes(i) && machine.visited.includes(i)) {
      classes += " both-path-bg";
    } else if (player.visited.includes(i)) {
      classes += " player-path-bg";
    } else if (machine.visited.includes(i)) {
      classes += " machine-path-bg";
    }

    html += `<div class="${classes}">${content}</div>`;
  }
  boardContainer.innerHTML = html;
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
  log(`\n=== JUEGO TERMINADO: ${reason} ===`, "highlight");

  let winner = "";
  let totalPot = player.money + machine.money;

  if (player.money > machine.money) {
    winner = "JUGADOR";
  } else if (machine.money > player.money) {
    winner = "MÁQUINA";
  } else {
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
    log(`¡ES UN EMPATE! Nadie se lleva el pozo.`, "highlight");
    els.status.textContent = "EMPATE";
  } else {
    log(`¡GANADOR: ${winner}! `, "success");
    log(`Premio total acumulado: $${totalPot}`, "success");
    els.status.textContent = `GANADOR: ${winner}`;
  }

  if (
    gameOverModal &&
    winnerDisplay &&
    gameOverReason &&
    finalPMoney &&
    finalPTreasures &&
    finalMMoney &&
    finalMTreasures
  ) {
    winnerDisplay.textContent =
      winner === "EMPATE" ? "¡EMPATE!" : `¡GANADOR: ${winner}!`;
    gameOverReason.textContent = reason;
    finalPMoney.textContent = player.money.toString();
    finalPTreasures.textContent = player.treasures.toString();
    finalMMoney.textContent = machine.money.toString();
    finalMTreasures.textContent = machine.treasures.toString();

    setTimeout(() => {
      gameOverModal.classList.remove("hidden");
    }, 1000);
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

function log(
  msg: string,
  type: "normal" | "success" | "error" | "dim" | "highlight" = "normal"
) {
  const div = document.createElement("div");
  div.className = `code-line ${type}`;
  div.textContent = `> ${msg}`;
  logsContainer.appendChild(div);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

const btnTeam = document.getElementById("btn-team");
const teamModal = document.getElementById("team-modal");
const closeModal = document.getElementById("close-modal");

if (btnTeam && teamModal && closeModal) {
  btnTeam.addEventListener("click", () => {
    if (welcomeScreen.classList.contains("hidden")) {
      gameScreen.classList.add("hidden");
      welcomeScreen.classList.remove("hidden");
      if (btnTeam) btnTeam.textContent = "EQUIPO";
      log("--- REINICIANDO SISTEMA ---", "dim");
    } else {
      teamModal.classList.remove("hidden");
    }
  });

  closeModal.addEventListener("click", () => {
    teamModal.classList.add("hidden");
  });

  teamModal.addEventListener("click", (e) => {
    if (e.target === teamModal) {
      teamModal.classList.add("hidden");
    }
  });
}

const btnRules = document.getElementById("btn-rules");
const rulesModal = document.getElementById("rules-modal");
const closeRulesModal = document.getElementById("close-rules-modal");

if (btnRules && rulesModal && closeRulesModal) {
  btnRules.addEventListener("click", () => {
    rulesModal.classList.remove("hidden");
  });

  closeRulesModal.addEventListener("click", () => {
    rulesModal.classList.add("hidden");
  });

  rulesModal.addEventListener("click", (e) => {
    if (e.target === rulesModal) {
      rulesModal.classList.add("hidden");
    }
  });
}

const btnMips = document.getElementById("btn-mips");
const mipsModal = document.getElementById("mips-modal");
const closeMipsModal = document.getElementById("close-mips-modal");

if (btnMips && mipsModal && closeMipsModal) {
  btnMips.addEventListener("click", () => {
    mipsModal.classList.remove("hidden");
  });

  closeMipsModal.addEventListener("click", () => {
    mipsModal.classList.add("hidden");
  });

  mipsModal.addEventListener("click", (e) => {
    if (e.target === mipsModal) {
      mipsModal.classList.add("hidden");
    }
  });
}

const gameOverModal = document.getElementById("game-over-modal");
const closeGameOverModal = document.getElementById("close-game-over-modal");
const btnRestartModal = document.getElementById("btn-restart-modal");
const winnerDisplay = document.getElementById("winner-display");
const gameOverReason = document.getElementById("game-over-reason");
const finalPMoney = document.getElementById("final-p-money");
const finalPTreasures = document.getElementById("final-p-treasures");
const finalMMoney = document.getElementById("final-m-money");
const finalMTreasures = document.getElementById("final-m-treasures");

if (gameOverModal && closeGameOverModal && btnRestartModal) {
  closeGameOverModal.addEventListener("click", () => {
    gameOverModal.classList.add("hidden");
  });

  btnRestartModal.addEventListener("click", () => {
    gameOverModal.classList.add("hidden");
    gameScreen.classList.add("hidden");
    welcomeScreen.classList.remove("hidden");
    if (btnTeam) btnTeam.textContent = "EQUIPO";
    log("--- REINICIANDO SISTEMA ---", "dim");
  });

  gameOverModal.addEventListener("click", (e) => {
    if (e.target === gameOverModal) {
      gameOverModal.classList.add("hidden");
    }
  });
}
