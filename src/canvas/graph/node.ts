import Konva from "konva";
import type Position from "../interface/position";
import Edge from "./edge";

export default class Vertex extends Konva.Group {
    private choosing: boolean = false;
    private bouding: Konva.Circle;

    constructor(pos: Position, text: string) {
        super({
            x: pos.x,
            y: pos.y,
            draggable: true,
            name: "node-group",
        });
        const circleComp = new Konva.Circle({
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            fill: "#fff",
        })
        const textComp = new Konva.Text({
            text: text,
            x: 0,
            y: 0,
            fontSize: 15,
            fontStyle: "bold",
            align: "center",
            verticalAlign: "middle",
            fill: "#000",
        })
        textComp.offsetX(textComp.width() / 2)
        textComp.offsetY(textComp.height() / 2)
        this.add(circleComp, textComp)

        this.bouding = new Konva.Circle({
            x: 0,
            y: 0,
            width: 35,
            height: 35,
            strokeWidth: 2,
            stroke: "#fff"
        })

        this.on("dragmove", () => {
            this.getLayer()!.children.forEach(e => {
                if (e instanceof Edge) {
                    e.reset();
                }
            })
        })
    }

    getChoosing(): boolean {
        return this.choosing;
    }

    setChoosing(choosing: boolean): void {
        this.choosing = choosing;
        if (this.choosing) {
            this.add(this.bouding)
        } else {
            this.bouding.remove();
        }
    }

}