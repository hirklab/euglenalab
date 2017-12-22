var img = new Image();

let asmWorker = new Worker('/views/account/developgame/game/ImageProcAsm/asm-worker.js');

var ImageProcModule = {
	postMessage: function(cmd) {
		asmWorker.postMessage
	}
};

var canvas;
$(function() {
return;	
canvas.processed = $("#processed")[0];
canvas.processed.context = canvas.processed.getContext("2d");
canvas.display = $("#display")[0];
canvas.display.context = canvas.display.getContext("2d");
startAsmWorker({"width": canvas.processed.width, "height": canvas.processed.height}, "nextFrame");

})

function startAsmWorker(imageData, command) {
	canvas.processed.context.drawImage(img, 0, 0, imageData.width, imageData.height, 0, 0, imageData.width, imageData.height);
	let message = { cmd: command, img: canvas.display.context.getImageData(0, 0, imageData.width, imageData.height) };

	asmWorker.postMessage(message);
}

asmWorker.onmessage = function (e) {
  updateCanvas(e, asmCanvas);
  perfasm1 = performance.now();
  console.log(`ASM: ${perfasm1 - perfasm0}`);
  if (!asmRan) {
    asmRan = true;
  } else {
    document.getElementById("asm-speed").innerText = String((perfasm1 - perfasm0).toFixed(2)) + " MS";
  }
}

function updateCanvas(e, canvas) {
  canvas.processed.context.strokeStyle = canvas.color;
  canvas.processed.context.lineWidth = 2;
  for (let i = 0; i < e.data.features.length; i++) {
    let rect = e.data.features[i];
    canvas.processed.context.strokeRect(rect.x * canvas.scale, rect.y * canvas.scale, rect.width * canvas.scale, rect.height * canvas.scale);
  }
}

