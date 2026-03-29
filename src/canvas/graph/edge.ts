import Konva from "konva";
import Vertex from "./node";


export default class Edge extends Konva.Line {
    private v1: Vertex | any | undefined;
    private v2: Vertex | any | undefined;
    private curveOffset: number = 0;

    constructor(config: Konva.LineConfig) {
        super(config)
    }

    addFirstVertex(v: Vertex | any | undefined) {
        this.v1 = v;
    }

    addLastVertex(v: Vertex | any | undefined) {
        this.v2 = v;
    }

    isContainsBoth(): boolean {
        return (this.v1 instanceof Vertex) && (this.v2 instanceof Vertex);
    }

    getBoth(): [Vertex, Vertex] {
        return [this.v1, this.v2]
    }

    hasVertex(vertex: Vertex): boolean {
        return this.v1 === vertex || this.v2 === vertex;
    }

    setCurveOffset(offset: number): void {
        this.curveOffset = offset;
        this.reset();
    }

    reset(): void {
        if (!((this.v1 instanceof Vertex) && (this.v2 instanceof Vertex)))
            return;

        const x1 = this.v1.x();
        const y1 = this.v1.y();
        const x2 = this.v2.x();
        const y2 = this.v2.y();

        if (Math.abs(this.curveOffset) < 0.001) {
            this.tension(0);
            this.points([x1, y1, x2, y2]);
            return;
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        if (length < 0.001) {
            this.tension(0);
            this.points([x1, y1, x2, y2]);
            return;
        }

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const nx = -dy / length;
        const ny = dx / length;
        const cx = mx + nx * this.curveOffset;
        const cy = my + ny * this.curveOffset;

        this.tension(0.5);
        this.points([x1, y1, cx, cy, x2, y2]);
    }
}