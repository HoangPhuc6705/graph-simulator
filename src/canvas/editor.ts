import type Konva from "konva";
import type { State } from "./interface/state";
import View from "./view";
import type { KonvaEventObject } from "konva/lib/Node";

export default class Editor {
    private state: State;

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.state = new View(stage, layer, this);
    }

    changeState(newState: State) {
        this.state = newState;
        this.state.render();
    }

    active(event: KonvaEventObject<MouseEvent, Konva.Stage>): void {
        this.state.active(event);
    }

    getState(): State {
        return this.state;
    }
}