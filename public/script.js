//////------------------------------------Canvas Signature------------------------------------------------------//
const context = $("canvas")[0].getContext("2d");
const canvas = $("canvas");
context.strokeStyle = "black";
let mousedown = null;
let exportSigURL;
let canvXaxis = canvas.offset().left;
let canvYaxis = canvas.offset().top;

canvas
    .on("mousedown", () => {
        mousedown = true;
        context.beginPath();
    })
    .on("mousemove", (e) => {
        if (mousedown) {
            let x = e.clientX;
            let y = e.clientY;

            //x/y coordinates of mouse relative to canvas
            x = x - canvXaxis;
            y = y - canvYaxis;

            context.lineTo(x, y);
            context.stroke();
        }
    })
    .on("mouseup", () => {
        if (mousedown) {
            exportSigURL = $("#canvas")[0].toDataURL();
            $("#sig").val(exportSigURL);
            exportSigURL = null;
        }
    });

$("body").on("mouseup", () => {
    mousedown = null;
});

$("#redoSig").on("click", () => {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    exportSigURL = null;
});
