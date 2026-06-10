const imageInput = document.getElementById('imageInput');
const sourceCanvas = document.getElementById('sourceCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const statusText = document.getElementById('status');
const sourceCtx = sourceCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');

let loadedImage = null;
let lastMode = 'layer';

imageInput.addEventListener('change', handleUpload);
document.getElementById('subjectBtn').addEventListener('click', generateSubjectAI);
document.getElementById('objectsBtn').addEventListener('click', testTextAPI);
document.getElementById('backgroundBtn').addEventListener('click', () => generateLayer('background'));
document.getElementById('downloadBtn').addEventListener('click', downloadResult);

function handleUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    statusText.textContent = 'No image selected.';
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      loadedImage = img;

      setupCanvas(sourceCanvas, img);
      setupCanvas(resultCanvas, img);

      sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

      sourceCtx.drawImage(img, 0, 0, sourceCanvas.width, sourceCanvas.height);

      statusText.textContent = 'Image uploaded. Click Generate Subject.';
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

function generateSubjectAI() {
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
    body: JSON.stringify({ imageBase64 })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        statusText.textContent = 'AI failed: ' + data.error;
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
        statusText.textContent = 'Subject PNG generated. Click Download PNG.';
      };

      resultImg.src = data.image;
    })
    .catch(error => {
      statusText.textContent = 'Backend connection failed.';
      console.error(error);
    });
}

function generateLayer(mode) {
  statusText.textContent = 'This button is still demo mode. Use Generate Subject for AI.';
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
function testTextAPI() {
  statusText.textContent = 'Connecting to Text API...';

  fetch('https://thumb-ai-backend.vercel.app/api/text')
    .then(response => response.json())
    .then(data => {
      statusText.textContent = data.message;
      alert(data.message);
    })
    .catch(error => {
      statusText.textContent = 'Text API connection failed.';
      console.error(error);
    });
}
function testTextAPI() {
  statusText.textContent = 'Connecting to Text API...';

  fetch('https://thumb-ai-backend.vercel.app/api/text')
    .then(response => response.json())
    .then(data => {
      statusText.textContent = data.message;
      alert(data.message);
    })
    .catch(error => {
      statusText.textContent = 'Text API connection failed.';
      console.error(error);
    });
}
