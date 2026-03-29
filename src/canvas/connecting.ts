import type Konva from "konva";
import type { State } from "./interface/state";
import Toolbar from "./toolbar";
import type { KonvaEventObject } from "konva/lib/Node";
import type Editor from "./editor";
import Edge from "./graph/edge";
import Vertex from "./graph/node";

type KonvaEvt = KonvaEventObject<MouseEvent, Konva.Stage>;
type MouseState = "default" | "dragging"

export default class Connecting extends Toolbar implements State {
    private editor: Editor;
    tempEdge: Edge | undefined;
    private connectingState: ConnectingState;
    mouseState: MouseState = "default"

    private starting: ConnectingState;
    private dragging: ConnectingState;
    private ending: ConnectingState;

    constructor(stage: Konva.Stage, layer: Konva.Layer, editor: Editor) {
        super(stage, layer)
        this.editor = editor;
        this.starting = new Starting(this);
        this.dragging = new Dragging(this);
        this.ending = new Ending(this);
        this.connectingState = this.starting;
    }

    active(event: KonvaEvt): void {
        this.connectingState.start(event)
        this.connectingState.dragging(event)
        this.connectingState.end(event)
    }

    changeConnectingState(cntState: ConnectingState): void {
        this.connectingState = cntState;
    }

    render(): void {
        super.clean();
        (document.getElementById("connecting") as HTMLButtonElement).classList.add("toolbar-button-choosing")
        this.layer.children.forEach(shape => {
            if (shape instanceof Vertex) {
                shape.draggable(false)
            }
        })

        this.stage.on("mousedown", (event) => {
            if (this.mouseState === "default") {
                this.mouseState = "dragging"
                this.active(event)
                this.changeConnectingState(this.dragging);
            }
        });
        this.stage.on("mousemove", (event) => {
            if (this.mouseState === "dragging") {
                this.active(event);
            }
        });
        this.stage.on("mouseup", (event) => {
            if (this.mouseState === "dragging") {
                this.mouseState = "default"
                this.changeConnectingState(this.ending);
                this.active(event)
                this.changeConnectingState(this.starting);
            }
        });
    }

    getStarting = (): ConnectingState => this.starting;
    getDragging = (): ConnectingState => this.dragging;
    getEnding = (): ConnectingState => this.ending;
    getLayer = (): Konva.Layer => this.layer;

    refreshParallelEdges(v1: Vertex, v2: Vertex): void {
        const parallelEdges: Edge[] = [];
        this.layer.children.forEach((shape) => {
            if (!(shape instanceof Edge) || !shape.isContainsBoth()) {
                return;
            }
            const [a, b] = shape.getBoth();
            const isSamePair = (a === v1 && b === v2) || (a === v2 && b === v1);
            if (isSamePair) {
                parallelEdges.push(shape);
            }
        });

        const spacing = 32;
        const midIndex = (parallelEdges.length - 1) / 2;
        parallelEdges.forEach((edge, index) => {
            const baseOffset = (index - midIndex) * spacing;
            const [a, b] = edge.getBoth();
            const isSameDirection = a === v1 && b === v2;
            const normalizedOffset = isSameDirection ? baseOffset : -baseOffset;
            edge.setCurveOffset(normalizedOffset);
        });

        this.layer.batchDraw();
    }
}

interface ConnectingState {
    start(evt: KonvaEvt): void
    dragging(evt: KonvaEvt): void
    end(evt: KonvaEvt): void
}

class Starting implements ConnectingState {
    private connecting: Connecting;
    constructor(connecting: Connecting) {
        this.connecting = connecting;
    }
    start(evt: KonvaEvt): void {
        const pos = evt.currentTarget.getRelativePointerPosition()!;
        const v1 = evt.target.findAncestor(".node-group");
        this.connecting.tempEdge = new Edge({
            stroke: "#fff",
            strokeWidth: 2,
            points: [pos.x, pos.y, pos.x, pos.y],
            listening: false
        });
        this.connecting.tempEdge.addFirstVertex(v1);
        this.connecting.getLayer().add(this.connecting.tempEdge)
    }
    dragging(evt: KonvaEvt): void {}
    end(evt: KonvaEvt): void {}
}

class Dragging implements ConnectingState {
    private connecting: Connecting;
    constructor(connecting: Connecting) {
        this.connecting = connecting;
    }
    start(evt: KonvaEvt): void {}
    dragging(evt: KonvaEvt): void {
        if (this.connecting.tempEdge) {
            const pos = evt.currentTarget.getRelativePointerPosition()!;
            const [x1, y1] = [this.connecting.tempEdge.points()[0], this.connecting.tempEdge.points()[1]]
            this.connecting.tempEdge.points([x1, y1, pos.x, pos.y])
        }
    }
    end(evt: KonvaEvt): void {}
}

class Ending implements ConnectingState {
    private connecting: Connecting;
    constructor(connecting: Connecting) {
        this.connecting = connecting;
    }
    start(evt: KonvaEvt): void {}
    dragging(evt: KonvaEvt): void {}
    end(evt: KonvaEvt): void {
        const v2 = evt.target.findAncestor(".node-group");

        if (this.connecting.tempEdge) {
            this.connecting.tempEdge.addLastVertex(v2)
            if (this.connecting.tempEdge.isContainsBoth()) {
                const [v1, v2] = this.connecting.tempEdge.getBoth();
                const edge: Edge = new Edge({
                    stroke: "#fff",
                    strokeWidth: 2,
                    points: [v1.x(), v1.y(), v2.x(), v2.y()]
                })
                edge.addFirstVertex(v1);
                edge.addLastVertex(v2);
                // render edge
                this.connecting.getLayer().add(edge);
                edge.moveToBottom()
                this.connecting.tempEdge.destroy();
                this.connecting.refreshParallelEdges(v1, v2);

                // Refresh property panel with the latest degree/adjacent values.
                this.connecting.showDetail(v2);
            } else {
                this.connecting.tempEdge.destroy();
            }
        }
    }

    renderEdge(): void {

    }
}