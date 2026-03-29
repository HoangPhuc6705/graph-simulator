import Konva from "konva";
import type { State } from "./interface/state";
import Toolbar from "./toolbar";
import type { KonvaEventObject } from "konva/lib/Node";
import type Editor from "./editor";
import Vertex from "./graph/node";

export default class Adding extends Toolbar implements State {
    private editor: Editor;

    constructor(stage: Konva.Stage, layer: Konva.Layer, editor: Editor) {
        super(stage, layer)
        this.editor = editor;
        stage.on("mousedown", (event) => {
            editor.active(event);
        })
    }
    active(event: KonvaEventObject<MouseEvent, Konva.Stage>): void {;
        if (this.isContainsVertex(event.target.findAncestor(".node-group", true)))
            return;
        const pos = this.stage.getRelativePointerPosition()!;
        const node: Vertex = new Vertex(
            { x: pos.x, y: pos.y },
            this.countNode.toString()
        );

        this.layer.add(node)
        this.layer.batchDraw();
        ++this.countNode;
    }

    isContainsVertex(shape: any): boolean {
        return shape instanceof Vertex;
    }

    render(): void {
        super.clean();
        (document.getElementById("adding") as HTMLButtonElement).classList.add("toolbar-button-choosing")

        this.stage.on("click", (event) => {
            this.editor.active(event)
        })
    }
}