import { MIPS } from "@specy/mips";
import { mipsCode } from "./mips-code";

let mips: any = null;

export function initMips() {
  mips = MIPS.makeMipsFromSource(mipsCode);
  mips.assemble();
  mips.initialize(true);
  runMipsUntilWait();
}

export function getMips() {
  return mips;
}

export function runMipsUntilWait() {
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

export function sendCommand(cmd: number, arg0: number = 0) {
  if (!mips) return;
  console.log(`[MIPS] Executing Command: ${cmd} with Arg: ${arg0}`);
  mips.setRegisterValue("$a0", arg0);
  mips.setRegisterValue("$v0", cmd);
  runMipsUntilWait();
}

export function readMemoryBytes(addr: number, length: number) {
  if (!mips) return new Uint8Array(length);
  return mips.readMemoryBytes(addr, length);
}

export function getRegisterValue(reg: string) {
  if (!mips) return 0;
  return mips.getRegisterValue(reg);
}
