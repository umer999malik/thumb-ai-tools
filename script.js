const imageInput = document.getElementById('imageInput');
const sourceCanvas = document.getElementById('sourceCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const statusText = document.getElementById('status');
const sourceCtx = sourceCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');
let loadedImage = null;
let lastMode = 'layer';

imageInput.addEventListener('change', handleUpload);
document.getElementById('subjectBtn').addEventListener('click', testBackend);
document.getElementById('objectsBtn').addEventListener('click', () => generateLayer('objects'));
document.getElementById('backgroundBtn').addEventListener('click', () => generateLayer('background'));
document.getElementById('downloadBtn').addEventListener('click', downloadResult);

function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      setupCanvas(sourceCanvas, img);
      setupCanvas(resultCanvas, img);
      sourceCtx.drawImage(img, 0, 0, sourceCanvas.width, sourceCanvas.height);
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      statusText.textContent = 'Image uploaded. Choose Subject, Objects, or Background.';
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function setupCanvas(canvas, img) {
  const maxWidth = 1100;
  const scale = Math.min(1, maxWidth / img.width);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
}

function generateLayer(mode) {
  if (!loadedImage) {
    statusText.textContent = 'Please upload a thumbnail first.';
    return;
  }

  lastMode = mode;
  sourceCtx.drawImage(loadedImage, 0, 0, sourceCanvas.width, sourceCanvas.height);
  const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const data = imageData.data;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;

    let keep = true;

    if (mode === 'subject') {
      // Keeps central, brighter, higher-contrast pixels. Works best for common YouTube thumbnails.
      keep = distance < 0.48 && (brightness > 45 || saturation > 35);
    }

    if (mode === 'objects') {
      // Keeps high-detail/high-saturation areas across the image.
      keep = saturation > 42 && brightness > 35;
    }

    if (mode === 'background') {
      // Removes the likely central subject area and keeps the rest.
      keep = !(distance < 0.48 && (brightness > 45 || saturation > 35));
    }

    if (!keep) data[i + 3] = 0;
  }

  resultCanvas.width = sourceCanvas.width;
  resultCanvas.height = sourceCanvas.height;
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  resultCtx.putImageData(imageData, 0, 0);
  statusText.textContent = `${capitalize(mode)} layer generated. Click Download PNG to save it.`;
}

function downloadResult() {
  if (!loadedImage) {
    statusText.textContent = 'Please upload and generate a layer first.';
    return;
  }
  const link = document.createElement('a');
  link.download = `${lastMode}-thumbnail-layer.png`;
  link.href = resultCanvas.toDataURL('image/png');
  link.click();
}
function testBackend() {
  if (!loadedImage) {
    statusText.textContent = 'Please upload a thumbnail first.';
    return;
  }

  statusText.textContent = 'Generating subject PNG...';

  const imageBase64 = sourceCanvas.toDataURL('image/png');

  fetch('https://thumb-ai-backend.vercel.app/api/subject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64: imageBase64
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        statusText.textContent = 'AI failed: ' + data.error;
        alert('AI failed: ' + data.error);
        console.log(data.details);
        return;
      }

      const resultImg = new Image();
      resultImg.onload = () => {
        resultCanvas.width = resultImg.width;
        resultCanvas.height = resultImg.height;
        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        resultCtx.drawImage(resultImg, 0, 0);
        lastMode = 'subject';
        statusText.textContent = 'Subject PNG generated. Click Download PNG to save it.';
      };

      resultImg.src = data.image;
    })
    .catch(error => {
      statusText.textContent = 'Backend connection failed.';
      alert('Backend connection failed.');
      console.error(error);
    });
}
    });
}
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
