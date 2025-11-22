import "./style.css";
import { initUI, renderMipsCode } from "./ui";
import { startGame, resetGame, playTurn } from "./game";

renderMipsCode();

initUI({
    onStart: (size) => startGame(size),
    onReset: () => resetGame(),
    onMove: (steps) => playTurn(steps)
});
