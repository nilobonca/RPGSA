declare module '@3d-dice/dice-box' {
  export default class DiceBox {
    constructor(selector: string, options?: any);
    init(): Promise<this>;
    roll(command: string | string[]): Promise<any>;
    clear(): void;
  }
}
