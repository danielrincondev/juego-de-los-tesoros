import {
  initMips,
  sendCommand,
  getRegisterValue,
  readMemoryBytes,
  getMips,
} from "./mips-service";
import {
  boardSize,
  setBoardSize,
  setInitialBoard,
  player,
  machine,
  setGameActive,
  turnCount,
  setTurnCount,
  incrementTurnCount,
  resetState,
} from "./state";
import {
  log,
  updateStats,
  renderBoard,
  showGameOverModal,
  showGameScreen,
  showWelcomeScreen,
  clearLogs,
  els,
} from "./ui";

export function startGame(size: number) {
  setBoardSize(size);

  player.visited = [0];
  machine.visited = [0];
  player.finished = false;
  machine.finished = false;

  initMips();
  sendCommand(1, size);

  captureInitialBoard();

  updateFromMips();

  setGameActive(true);
  setTurnCount(1);

  showGameScreen();
  updateStats();

  clearLogs();
  log("=== INICIALIZANDO JUEGO DE LOS TESOROS (MIPS) ===", "highlight");
  log(`Tablero generado: ${size} casillas.`, "dim");
  log("Esperando comando del jugador...", "success");
}

export function resetGame() {
  showWelcomeScreen();
  log("--- REINICIANDO SISTEMA ---", "dim");
  resetState();
}

function captureInitialBoard() {
  const mips = getMips();
  if (!mips) return;
  const size = boardSize;
  const baseAddr = getRegisterValue("$s7");
  const bytes = readMemoryBytes(baseAddr, size * 4);

  const newBoard: number[] = [];
  for (let i = 0; i < size; i++) {
    let val =
      bytes[i * 4] |
      (bytes[i * 4 + 1] << 8) |
      (bytes[i * 4 + 2] << 16) |
      (bytes[i * 4 + 3] << 24);
    if (val > 2147483647) val = val - 4294967296;
    newBoard.push(val);
  }
  setInitialBoard(newBoard);
}

export function playTurn(playerSteps: number) {
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
    const roll = getRegisterValue("$v1");
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
        incrementTurnCount();
        els.turn.textContent = `Turno ${turnCount}`;
      }
    }, 500);
  } else {
    log("Máquina ya llegó al final.", "dim");
    if (!checkGameOver()) {
      incrementTurnCount();
      els.turn.textContent = `Turno ${turnCount}`;
    }
  }
}

function updateFromMips() {
  const mips = getMips();
  if (!mips) return;

  const newPPos = getRegisterValue("$s0");
  console.log(`[MIPS State Read] Player Pos ($s0): ${newPPos}`);

  player.position = newPPos;
  if (!player.visited.includes(newPPos)) player.visited.push(newPPos);

  player.money = getRegisterValue("$s1");
  player.treasures = getRegisterValue("$s2");

  const newMPos = getRegisterValue("$s3");
  machine.position = newMPos;
  if (!machine.visited.includes(newMPos)) machine.visited.push(newMPos);

  machine.money = getRegisterValue("$s4");
  machine.treasures = getRegisterValue("$s5");

  if (player.position >= boardSize - 1) player.finished = true;
  if (machine.position >= boardSize - 1) machine.finished = true;

  updateStats();
  renderBoard();
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
  setGameActive(false);
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

  showGameOverModal(winner, reason);
}
