import Adding from "./adding";
import Connecting from "./connecting";
import Editor from "./editor";
import Handing from "./handing";
import { layer, stage } from "./initial_canvas";
import type { State } from "./interface/state";
import View from "./view";


const editor: Editor = new Editor(stage, layer);
const view: State = new View(stage, layer, editor)
const handing: State = new Handing(stage, layer, editor)
const adding: State = new Adding(stage, layer, editor)
const connecting: State = new Connecting(stage, layer, editor)

editor.changeState(view)

document.getElementById("view")?.addEventListener('click', () => {
    editor.changeState(view)
})
document.getElementById("handing")?.addEventListener('click', () => {
    editor.changeState(handing)
})
document.getElementById("adding")?.addEventListener('click', () => {
    editor.changeState(adding)
})
document.getElementById("connecting")?.addEventListener('click', () => {
    editor.changeState(connecting)
})


const keyMap = new Map<string, State>()
keyMap.set("v", view)
keyMap.set("h", handing)
keyMap.set("a", adding)
keyMap.set("c", connecting)


document.addEventListener("keydown", (event) => {
    if (event.repeat)
        return;
    const state = keyMap.get(event.key);
    if (state) {
        editor.changeState(state)
    }
})

// document.addEventListener("keyup", (event) => {
//     if (event.key === " ") {
//         editor.changeState(view);
//     }
// })

document.addEventListener("keydown", (event) => {
    if (editor.getState() instanceof View && event.key === "Delete") {
        (editor.getState() as View).destroy()
    }
})