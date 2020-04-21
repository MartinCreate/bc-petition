//////------------------------------------Canvas Signature------------------------------------------------------//
const canvas = $("canvas");
const context = canvas[0].getContext("2d");
context.strokeStyle = "black";
let mousedown = null;
let exportSigURL;

canvas
    .on("mousedown", () => {
        mousedown = true;
        context.beginPath();
    })
    .on("mousemove", (e) => {
        if (mousedown) {
            const canv = canvas[0].getBoundingClientRect();
            let x = e.clientX - canv.left;
            let y = e.clientY - canv.top;

            context.lineTo(x, y);
            context.stroke();
        }
    });

$("body").on("mouseup", () => {
    if (mousedown) {
        exportSigURL = $("#canvas")[0].toDataURL();
        $("#sig").val(exportSigURL);
    }
    mousedown = null;
});

$("#redoSig").on("click", () => {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    exportSigURL = null;
    $("#sig").val(null);
});
