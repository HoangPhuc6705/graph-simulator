import type Konva from "konva"
import type { KonvaEventObject } from "konva/lib/Node"

export interface State {
    active(event: KonvaEventObject<MouseEvent, Konva.Stage>): void
    render(): void
}