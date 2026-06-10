const imageInput = document.getElementById('imageInput');
const sourceCanvas = document.getElementById('sourceCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const statusText = document.getElementById('status');
const sourceCtx = sourceCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');

let loadedImage = null;
let lastMode = 'layer';

imageInput.addEventListener('change', handleUpload);
document.getElementById('subjectBtn').addEventListener('click', generateSubject);
document.getElementById('objectsBtn').addEventListener('click', generateText);
document.getElementById('backgroundBtn').addEventListener('click', () => {
  statusText.textContent = 'Background feature is not ready yet.';
});
document.getElementById('downloadBtn').addEventListener('click', downloadResult);

function handleUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    statusText.textContent = 'No image selected.';
    return;
  }

  loadedImage = file;

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      setupCanvas(sourceCanvas, img);
      setupCanvas(resultCanvas, img);

      sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

      sourceCtx.drawImage(img, 0, 0, sourceCanvas.width, sourceCanvas.height);

      statusText.textContent = 'Image uploaded. Choose Subject or Text PNG.';
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

async function generateSubject() {
  if (!loadedImage) {
    statusText.textContent = 'Please upload a thumbnail first.';
    return;
  }

  statusText.textContent = 'Generating subject PNG...';

  const formData = new FormData();
  formData.append('file', loadedImage);

  try {
    const response = await fetch('http://127.0.0.1:8000/subject', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      statusText.textContent = 'Subject generation failed.';
      return;
    }

    const blob = await response.blob();
    showResult(blob, 'subject');
  } catch (error) {
    statusText.textContent = 'Local Python backend is not running.';
    console.error(error);
  }
}

async function generateText() {
  if (!loadedImage) {
    statusText.textContent = 'Please upload a thumbnail first.';
    return;
  }

  statusText.textContent = 'Generating text PNG...';

  const formData = new FormData();
  formData.append('file', loadedImage);

  try {
    const response = await fetch('http://127.0.0.1:8000/text', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      statusText.textContent = 'Text generation failed.';
      return;
    }

    const blob = await response.blob();
    showResult(blob, 'text');
  } catch (error) {
    statusText.textContent = 'Local Python backend is not running.';
    console.error(error);
  }
}

function showResult(blob, mode) {
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    resultCanvas.width = img.width;
    resultCanvas.height = img.height;
    resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    resultCtx.drawImage(img, 0, 0);

    lastMode = mode;
    statusText.textContent = `${mode}.png generated. Click Download PNG.`;

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

function downloadResult() {
  const link = document.createElement('a');
  link.download = `${lastMode}.png`;
  link.href = resultCanvas.toDataURL('image/png');
  link.click();
}
