import Konva from "konva";
import type { State } from "./interface/state";
import Toolbar from "./toolbar";
import type { KonvaEventObject } from "konva/lib/Node";
import type Editor from "./editor";
import Vertex from "./graph/node";
import Edge from "./graph/edge";

export default class View extends Toolbar implements State {
    private editor: Editor;
    private currentChoosing: Vertex | undefined = undefined;

    constructor(stage: Konva.Stage, layer: Konva.Layer, editor: Editor) {
        super(stage, layer)
        this.editor = editor;
        stage.on("mousedown", (event) => {
            editor.active(event);
        })
    }
    active(event: KonvaEventObject<MouseEvent, Konva.Stage>): void {
        const vertex = event.target.findAncestor(".node-group", true);
        if (vertex instanceof Vertex) {
            if (this.currentChoosing) {
                this.currentChoosing.setChoosing(false)
            }
            vertex.setChoosing(true);
            this.currentChoosing = vertex;
            this.showDetail(this.currentChoosing)
        } else {
            if (this.currentChoosing) {
                this.currentChoosing.setChoosing(false);
                this.currentChoosing = undefined;
            }
        }
    }

    destroy(): void {
        if (this.currentChoosing) {
            const deletingVertex = this.currentChoosing;
            const layerShapes = this.layer.getChildren();

            const needDestroyShapes = layerShapes.filter((shape: Konva.Node) => {
                if (shape instanceof Edge) {
                    return shape.hasVertex(deletingVertex);
                }

                return (
                    shape instanceof Konva.Circle
                    && shape.getAttr("isLoopCircle") === true
                    && shape.getAttr("loopOwner") === deletingVertex
                );
            });

            needDestroyShapes.forEach((shape: Konva.Node) => {
                shape.destroy();
            });

            Toolbar.loopCountByVertex.delete(deletingVertex);
            Toolbar.loopAngleByVertex.delete(deletingVertex);

            deletingVertex.setChoosing(false);
            deletingVertex.destroy();
            this.currentChoosing = undefined;
            this.detailController?.abort();
            this.layer.batchDraw();
        }
    }

    render(): void {
        super.clean();
        (document.getElementById("view") as HTMLButtonElement).classList.add("toolbar-button-choosing")
        this.stage.on("mousedown", (event) => {
            this.editor.active(event)
        })
    }
}