import { mipsCode } from "./mips-code";
import {
  boardSize,
  initialBoard,
  player,
  machine,
  gameActive,
  turnCount,
} from "./state";
import { getMips, getRegisterValue, readMemoryBytes } from "./mips-service";

const logsContainer = document.getElementById("game-logs")!;
const mipsDisplay = document.getElementById("mips-code-display");

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

const btnTeam = document.getElementById("btn-team");
const teamModal = document.getElementById("team-modal");
const closeModal = document.getElementById("close-modal");

const btnRules = document.getElementById("btn-rules");
const rulesModal = document.getElementById("rules-modal");
const closeRulesModal = document.getElementById("close-rules-modal");

const btnMips = document.getElementById("btn-mips");
const mipsModal = document.getElementById("mips-modal");
const closeMipsModal = document.getElementById("close-mips-modal");

const gameOverModal = document.getElementById("game-over-modal");
const closeGameOverModal = document.getElementById("close-game-over-modal");
const btnRestartModal = document.getElementById("btn-restart-modal");
const winnerDisplay = document.getElementById("winner-display");
const gameOverReason = document.getElementById("game-over-reason");
const finalPMoney = document.getElementById("final-p-money");
const finalPTreasures = document.getElementById("final-p-treasures");
const finalMMoney = document.getElementById("final-m-money");
const finalMTreasures = document.getElementById("final-m-treasures");

export const els = {
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

export function log(
  msg: string,
  type: "normal" | "success" | "error" | "dim" | "highlight" = "normal"
) {
  const div = document.createElement("div");
  div.className = `code-line ${type}`;
  div.textContent = `> ${msg}`;
  logsContainer.appendChild(div);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

export function clearLogs() {
  logsContainer.innerHTML = "";
}

export function renderMipsCode() {
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
}

export function updateStats() {
  els.pPos.textContent = player.position.toString();
  els.pMoney.textContent = player.money.toString();
  els.pTreasures.textContent = player.treasures.toString();

  els.mPos.textContent = machine.position.toString();
  els.mMoney.textContent = machine.money.toString();
  els.mTreasures.textContent = machine.treasures.toString();

  els.status.textContent = gameActive ? "EN PROGRESO" : "FINALIZADO";
  els.turn.textContent = `Turno ${turnCount}`;
}

export function renderBoard() {
  const boardContainer = document.getElementById("board-visual");
  const mips = getMips();
  if (!boardContainer || !mips) return;

  const size = boardSize;
  const baseAddr = getRegisterValue("$s7");
  const pPos = player.position;
  const mPos = machine.position;

  const bytes = readMemoryBytes(baseAddr, size * 4);

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

export function showGameOverModal(winner: string, reason: string) {
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

export function showGameScreen() {
  welcomeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  if (btnTeam) btnTeam.textContent = "REINICIAR";
}

export function showWelcomeScreen() {
  gameScreen.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");
  if (btnTeam) btnTeam.textContent = "EQUIPO";
}

export interface GameCallbacks {
  onStart: (size: number) => void;
  onReset: () => void;
  onMove: (steps: number) => void;
}

export function initUI(callbacks: GameCallbacks) {
  btnStart.addEventListener("click", () => {
    const size = parseInt(boardSizeInput.value);
    if (isNaN(size) || size < 20 || size > 120) {
      configError.textContent = "Error: El tamaño debe estar entre 20 y 120.";
      return;
    }
    configError.textContent = "";
    callbacks.onStart(size);
  });

  btnReset.addEventListener("click", () => {
    callbacks.onReset();
  });

  appLogo.addEventListener("click", () => {
    callbacks.onReset();
  });

  btnMove.addEventListener("click", () => {
    if (!gameActive) return;

    const steps = parseInt(moveInput.value);
    if (isNaN(steps) || steps < 1 || steps > 6) {
      log("Error: Movimiento inválido. Ingrese 1-6.", "error");
      return;
    }
    callbacks.onMove(steps);
  });

  // Modals
  if (btnTeam && teamModal && closeModal) {
    btnTeam.addEventListener("click", () => {
      if (welcomeScreen.classList.contains("hidden")) {
        callbacks.onReset();
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

  if (gameOverModal && closeGameOverModal && btnRestartModal) {
    closeGameOverModal.addEventListener("click", () => {
      gameOverModal.classList.add("hidden");
    });

    btnRestartModal.addEventListener("click", () => {
      gameOverModal.classList.add("hidden");
      callbacks.onReset();
    });

    gameOverModal.addEventListener("click", (e) => {
      if (e.target === gameOverModal) {
        gameOverModal.classList.add("hidden");
      }
    });
  }
}
