import type { PlayerState } from "./types";

export let boardSize: number = 30;
export let initialBoard: number[] = [];
export let player: PlayerState = {
  position: 0,
  money: 0,
  treasures: 0,
  finished: false,
  visited: [0],
};
export let machine: PlayerState = {
  position: 0,
  money: 0,
  treasures: 0,
  finished: false,
  visited: [0],
};
export let gameActive: boolean = false;
export let turnCount: number = 0;

export function setBoardSize(size: number) {
  boardSize = size;
}

export function setInitialBoard(board: number[]) {
  initialBoard = board;
}

export function setGameActive(active: boolean) {
  gameActive = active;
}

export function setTurnCount(count: number) {
  turnCount = count;
}

export function incrementTurnCount() {
  turnCount++;
}

export function resetState() {
  player.position = 0;
  player.money = 0;
  player.treasures = 0;
  player.finished = false;
  player.visited = [0];

  machine.position = 0;
  machine.money = 0;
  machine.treasures = 0;
  machine.finished = false;
  machine.visited = [0];

  gameActive = false;
  turnCount = 0;
}
