import Konva from "konva";

const canvas = document.getElementById("canvas") as HTMLDivElement;
const canvasDimension = {
    width: canvas.getBoundingClientRect().width,
    height: canvas.getBoundingClientRect().height
}

const stage = new Konva.Stage({
    container: "canvas",
    width: canvasDimension.width,
    height: canvasDimension.height,
    offset: {
        x: -canvasDimension.width / 2,
        y: -canvasDimension.height / 2
    },
})

const layer = new Konva.Layer()
stage.add(layer);


export { stage, layer }