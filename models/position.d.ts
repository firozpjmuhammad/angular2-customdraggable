export interface IPosition {
    x: number;
    y: number;
}
export declare class Position implements IPosition {
    x: number;
    y: number;
    constructor(x: number, y: number);
    static fromEvent(e: MouseEvent | TouchEvent, el?: any): Position;
    static isMouseEvent(e: MouseEvent | TouchEvent): e is MouseEvent;
    static isIPosition(obj: any): obj is IPosition;
    static getCurrent(el: Element): Position;
    static copy(p: IPosition): Position;
    readonly value: IPosition;
    add(p: IPosition): this;
    subtract(p: IPosition): this;
    multiply(n: number): void;
    divide(n: number): void;
    reset(): this;
    set(p: IPosition): this;
}
