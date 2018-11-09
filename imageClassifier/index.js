let net;

const webcamElement = document.getElementById('webcam');
const classifier = knnClassifier.create();

async function setupWebcam() {
    return new Promise((resolve, reject) => {
      const navigatorAny = navigator;
      navigator.getUserMedia = navigator.getUserMedia ||
          navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
          navigatorAny.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true},
          stream => {
            webcamElement.srcObject = stream;
            webcamElement.addEventListener('loadeddata',  () => resolve(), false);
          },
          error => reject());
      } else {
        reject();
      }
    });
  }

async function app() {
  console.log('Loading mobilenet..');

  // Load model
  net = await mobilenet.load();
  console.log('Sucessfully loaded model');

  await setupWebcam();

  // Reads an image from the webcam 
  const addExample = classId => {
   // passes example to the KNN classifier.
    const activation = net.infer(webcamElement, 'conv_preds');

    // Pass the activation to the classifier.
    classifier.addExample(activation, classId);
  };

  // When clicking a button, add an example for that class.
  document.getElementById('class-a').addEventListener('click', () => addExample(0));
  document.getElementById('class-b').addEventListener('click', () => addExample(1));
  document.getElementById('class-c').addEventListener('click', () => addExample(2));


  while (true) {
    if (classifier.getNumClasses() > 0) {
      // Get the image from the webcam.
      const activation = net.infer(webcamElement, 'conv_preds');
      // Get the confidences from the classifier
      const result = await classifier.predictClass(activation);

      const classes = ['A', 'B', 'C'];
      document.getElementById('console').innerText = `
        prediction: ${classes[result.classIndex]}\n
        probability: ${result.confidences[result.classIndex]}
      `;
    }

    // wait for computation to finish before snapping another image
    await tf.nextFrame();
  }
}

// run the program
app();