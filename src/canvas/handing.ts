import type Konva from "konva";
import type { State } from "./interface/state";
import Toolbar from "./toolbar";
import type { KonvaEventObject } from "konva/lib/Node";
import type Editor from "./editor";
import Vertex from "./graph/node";

export default class Handing extends Toolbar implements State {
    private editor: Editor;
    constructor(stage: Konva.Stage, layer: Konva.Layer, editor: Editor) {
        super(stage, layer)
        this.editor = editor;
    }
    active(event: KonvaEventObject<MouseEvent, Konva.Stage>): void {}
    render(): void {
        super.clean();
        (document.getElementById("handing") as HTMLButtonElement).classList.add("toolbar-button-choosing")
        document.body.style.cursor = "grab"
        this.stage.setDraggable(true);

        this.layer.children.forEach(shape => {
            if (shape instanceof Vertex) {
                shape.draggable(false)
            }
        })

        this.stage.on("mousedown", () => {
            document.body.style.cursor = "grabbing";
        })

        this.stage.on("dragmove", () => {
            document.body.style.cursor = "grabbing";
        });

        this.stage.on("mouseup", () => {
            document.body.style.cursor = "grab";
        });

        this.stage.on("mouseenter", () => {
            document.body.style.cursor = "grab";
        })

        this.stage.on("mouseout", () => {
            document.body.style.cursor = "context-menu";
        })
    }
}