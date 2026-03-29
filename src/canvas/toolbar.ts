import Konva from "konva";
import Vertex from "./graph/node";
import Edge from "./graph/edge";

export default class Toolbar {
    protected stage: Konva.Stage;
    protected layer: Konva.Layer;
    protected countNode = 0;
    protected static loopCountByVertex: Map<Vertex, number> = new Map();
    protected static loopAngleByVertex: Map<Vertex, number> = new Map();
    protected static activeToolbar: Toolbar | undefined;
    protected static codeUiInited = false;
    protected static codeMode: "adj-list" | "matrix" = "adj-list";
    protected detailController: AbortController | undefined;

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.stage = stage;
        this.layer = layer;
        Toolbar.activeToolbar = this;
        Toolbar.initCodeUi();
    }

    handleKeyDown(_event: KeyboardEvent): void {

    }

    clean(): void {
        Toolbar.activeToolbar = this;

        // remove all event
        this.stage.off("mousedown")
        this.stage.off("mouseup")
        this.stage.off("click")
        this.stage.off("dragstart")
        this.stage.off("dragend")
        this.stage.off("dragmove")
        this.stage.off("mouseenter")
        this.stage.off("mouseleave")

        // turn on draggable of vertex
        this.layer.children.forEach(shape => {
            if (shape instanceof Vertex) {
                shape.draggable(true)
            }
        })

        // turn off document listener
        document.removeEventListener("keydown", this.handleKeyDown)

        // add position pointer log
        this.stage.on("mousemove", (event) => {
            const pos = event.target.getRelativePointerPosition()!;
            document.getElementById("pointer-position")!.innerHTML = `Position: (${pos.x}, ${pos.y})`
        })
        this.stage.on("mouseleave", () => {
            document.getElementById("pointer-position")!.innerHTML = `Position: (NaN, NaN))`
        })

        const buttonToolbars = document.querySelectorAll(".toolbar-button");
        for (const btn of buttonToolbars) {
            (btn as HTMLButtonElement).classList.remove("toolbar-button-choosing")
        }
        document.body.style.cursor = "context-menu"
        this.stage.setDraggable(false);
    }

    private static initCodeUi(): void {
        if (Toolbar.codeUiInited) {
            return;
        }

        const openBtn = document.getElementById("generate-code-btn") as HTMLButtonElement | null;
        const popup = document.getElementById("code-popup") as HTMLDivElement | null;
        const overlay = document.getElementById("code-popup-overlay") as HTMLDivElement | null;
        const closeBtn = document.getElementById("close-code-popup") as HTMLButtonElement | null;
        const modeAdjBtn = document.getElementById("mode-adj-list") as HTMLButtonElement | null;
        const modeMatrixBtn = document.getElementById("mode-matrix") as HTMLButtonElement | null;
        const copyBtn = document.getElementById("copy-generated-code") as HTMLButtonElement | null;

        if (!openBtn || !popup || !overlay || !closeBtn || !modeAdjBtn || !modeMatrixBtn || !copyBtn) {
            return;
        }

        const setMode = (mode: "adj-list" | "matrix") => {
            Toolbar.codeMode = mode;
            modeAdjBtn.classList.toggle("code-mode-btn-active", mode === "adj-list");
            modeMatrixBtn.classList.toggle("code-mode-btn-active", mode === "matrix");
            Toolbar.updateGeneratedCode();
        };

        const openPopup = () => {
            popup.classList.remove("code-popup-hidden");
            popup.setAttribute("aria-hidden", "false");
            Toolbar.updateGeneratedCode();
        };

        const closePopup = () => {
            popup.classList.add("code-popup-hidden");
            popup.setAttribute("aria-hidden", "true");
        };

        openBtn.addEventListener("click", openPopup);
        overlay.addEventListener("click", closePopup);
        closeBtn.addEventListener("click", closePopup);
        modeAdjBtn.addEventListener("click", () => setMode("adj-list"));
        modeMatrixBtn.addEventListener("click", () => setMode("matrix"));

        copyBtn.addEventListener("click", async () => {
            const output = document.getElementById("generated-code-output") as HTMLTextAreaElement | null;
            if (!output) {
                return;
            }
            try {
                await navigator.clipboard.writeText(output.value);
                copyBtn.textContent = "Copied";
                window.setTimeout(() => {
                    copyBtn.textContent = "Copy";
                }, 900);
            } catch {
                output.select();
                document.execCommand("copy");
            }
        });

        Toolbar.codeUiInited = true;
    }

    private static updateGeneratedCode(): void {
        const output = document.getElementById("generated-code-output") as HTMLTextAreaElement | null;
        if (!output) {
            return;
        }
        const source = Toolbar.activeToolbar?.buildGraphSource(Toolbar.codeMode) ?? "// No graph data";
        output.value = source;
    }

    private buildGraphSource(mode: "adj-list" | "matrix"): string {
        const vertices = this.layer.children.filter((shape) => shape instanceof Vertex) as Vertex[];
        const edges = this.layer.children.filter(
            (shape) => shape instanceof Edge && shape.isContainsBoth()
        ) as Edge[];

        if (mode === "adj-list") {
            if (edges.length === 0) {
                return "// No edges\nGraph<Integer> graph = new Graph<>();";
            }
            const edgeLines = edges
                .map((edge) => {
                    const [v1, v2] = edge.getBoth();
                    const v1Text = (v1.findOne("Text") as Konva.Text | null)?.text() ?? "v1";
                    const v2Text = (v2.findOne("Text") as Konva.Text | null)?.text() ?? "v2";
                    return `graph.addEdge(${this.toJavaLiteral(v1Text)}, ${this.toJavaLiteral(v2Text)});`;
                })
                .join("\n");
            return `Graph graph = new Graph();\n${edgeLines}`;
        }

        if (vertices.length === 0) {
            return "int[][] matrix = new int[0][0];";
        }

        const indexByVertex = new Map<Vertex, number>();
        vertices.forEach((vertex, index) => {
            indexByVertex.set(vertex, index);
        });

        const matrix = Array.from({ length: vertices.length }, () => Array(vertices.length).fill(0));
        edges.forEach((edge) => {
            const [v1, v2] = edge.getBoth();
            const i = indexByVertex.get(v1);
            const j = indexByVertex.get(v2);
            if (i === undefined || j === undefined) {
                return;
            }
            matrix[i][j] = 1;
            matrix[j][i] = 1;
        });

        const order = vertices
            .map((vertex) => (vertex.findOne("Text") as Konva.Text | null)?.text() ?? "?")
            .join(", ");
        const rows = matrix.map((row) => `    {${row.join(", ")}}`).join(",\n");
        return `// Vertex order: ${order}\nint[][] matrix = {\n${rows}\n};`;
    }

    private toJavaLiteral(value: string): string {
        const trimmed = value.trim();
        if (/^-?\d+$/.test(trimmed)) {
            return trimmed;
        }
        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) {
            return trimmed;
        }
        return `"${value.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"")}"`;
    }

    showDetail(currentChoosing: Vertex | undefined): void {
        if (!currentChoosing) {
            return;
        }

        const root = document.getElementById("node-property");
        if (!root) {
            return;
        }

        const valueInput = root.querySelector("#prop-value") as HTMLInputElement | null;
        const degreeElement = root.querySelector("#prop-degree") as HTMLSpanElement | null;
        const loopToggle = root.querySelector("#prop-loop-toggle") as HTMLInputElement | null;
        const loopCountInput = root.querySelector("#prop-loop-count") as HTMLInputElement | null;
        const loopAngleInput = root.querySelector("#prop-loop-angle") as HTMLInputElement | null;
        const loopAngleValue = root.querySelector("#prop-loop-angle-value") as HTMLSpanElement | null;
        const adjacentElement = root.querySelector("#prop-adjacents") as HTMLSpanElement | null;

        if (!valueInput || !degreeElement || !loopCountInput || !loopAngleInput || !loopAngleValue || !adjacentElement) {
            return;
        }

        const currentNode = currentChoosing;
        const textComp = currentNode.findOne("Text") as Konva.Text | null;
        if (!textComp) {
            return;
        }

        currentNode.off("dragmove.loop-visual");
        currentNode.on("dragmove.loop-visual", () => {
            this.syncLoopVisual(currentNode);
        });

        const buildDetail = () => {
            const loopCount = Toolbar.loopCountByVertex.get(currentNode) ?? 0;
            const loopAngle = Toolbar.loopAngleByVertex.get(currentNode) ?? 0;
            const adjacentValues: string[] = [];
            let degree = loopCount * 2;

            this.layer.children.forEach((shape) => {
                if (!(shape instanceof Edge)) {
                    return;
                }
                if (!shape.isContainsBoth()) {
                    return;
                }

                const [v1, v2] = shape.getBoth();
                if (v1 === currentNode && v2 === currentNode) {
                    degree += 2;
                    adjacentValues.push(textComp.text());
                    return;
                }
                if (v1 === currentNode) {
                    degree += 1;
                    const v2Text = v2.findOne("Text") as Konva.Text | null;
                    if (v2Text) {
                        adjacentValues.push(v2Text.text());
                    }
                    return;
                }
                if (v2 === currentNode) {
                    degree += 1;
                    const v1Text = v1.findOne("Text") as Konva.Text | null;
                    if (v1Text) {
                        adjacentValues.push(v1Text.text());
                    }
                }
            });

            if (loopCount > 0) {
                adjacentValues.push(textComp.text());
            }

            const uniqueAdjacents = [...new Set(adjacentValues)];
            degreeElement.textContent = degree.toString();
            adjacentElement.textContent = uniqueAdjacents.length > 0 ? uniqueAdjacents.join(", ") : "Null";
            loopCountInput.value = loopCount.toString();
            if (loopToggle) {
                loopToggle.checked = loopCount > 0;
            }
            loopAngleInput.value = loopAngle.toString();
            loopAngleValue.textContent = `${loopAngle}deg`;
        };

        valueInput.value = textComp.text();
        buildDetail();

        this.detailController?.abort();
        this.detailController = new AbortController();
        const signal = this.detailController.signal;

        valueInput.addEventListener("input", () => {
            textComp.text(valueInput.value);
            textComp.offsetX(textComp.width() / 2);
            textComp.offsetY(textComp.height() / 2);
            this.layer.batchDraw();
            buildDetail();
        }, { signal });

        const updateLoop = (rawCount: number) => {
            const nextLoopCount = Math.max(0, Math.floor(rawCount));
            if (nextLoopCount === 0) {
                Toolbar.loopCountByVertex.delete(currentNode);
            } else {
                Toolbar.loopCountByVertex.set(currentNode, nextLoopCount);
            }
            this.syncLoopVisual(currentNode);
            this.layer.batchDraw();
            buildDetail();
        };

        if (loopToggle) {
            loopToggle.addEventListener("change", () => {
                if (loopToggle.checked) {
                    const count = Number(loopCountInput.value);
                    updateLoop(count > 0 ? count : 1);
                } else {
                    updateLoop(0);
                }
            }, { signal });
        }

        loopCountInput.addEventListener("input", () => {
            updateLoop(Number(loopCountInput.value));
        }, { signal });

        loopAngleInput.addEventListener("input", () => {
            const angle = Math.max(0, Math.min(360, Math.floor(Number(loopAngleInput.value) || 0)));
            Toolbar.loopAngleByVertex.set(currentNode, angle);
            this.syncLoopVisual(currentNode);
            this.layer.batchDraw();
            buildDetail();
        }, { signal });
    }

    private syncLoopVisual(vertex: Vertex): void {
        const loops = this.layer.children.filter(
            (shape) => shape instanceof Konva.Circle && shape.getAttr("isLoopCircle") === true && shape.getAttr("loopOwner") === vertex
        );

        loops.forEach((shape) => shape.destroy());

        const loopCount = Toolbar.loopCountByVertex.get(vertex) ?? 0;
        if (loopCount <= 0) {
            return;
        }

        const angleDeg = Toolbar.loopAngleByVertex.get(vertex) ?? 0;
        const angleRad = angleDeg * (Math.PI / 180);

        const baseRadius = 22;
        const radiusStep = 14;

        for (let i = 0; i < loopCount; i++) {
            const radius = baseRadius + radiusStep * i;
            const cx = vertex.x() + radius * Math.sin(angleRad);
            const cy = vertex.y() - radius * Math.cos(angleRad);

            const loop = new Konva.Circle({
                x: cx,
                y: cy,
                radius,
                stroke: "#fff",
                strokeWidth: 2,
                fillEnabled: false,
                listening: false,
                name: "vertex-loop"
            });
            loop.setAttr("isLoopCircle", true);
            loop.setAttr("loopOwner", vertex);
            this.layer.add(loop);
            loop.moveToBottom();
        }
    }
}