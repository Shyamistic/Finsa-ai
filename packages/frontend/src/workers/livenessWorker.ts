// Liveness Web Worker — runs entirely in browser
// No raw video frames are sent to the server (CP-06)
// Only the result object { passed, confidence, challenge, age_estimate } is posted

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

interface LivenessRequest {
  imageData: ImageData;
  challenge: 'blink' | 'nod';
  sessionId: string;
}

interface LivenessResponse {
  passed: boolean;
  confidence: number;
  challenge: string;
  age_estimate: number | null;
  session_id: string;
}

self.onmessage = async (event: MessageEvent<LivenessRequest>) => {
  const { imageData, challenge, sessionId } = event.data;

  try {
    await loadModels();

    // Create canvas from ImageData
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    const detections = await faceapi
      .detectSingleFace(canvas as unknown as HTMLCanvasElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceExpressions()
      .withAgeAndGender();

    if (!detections) {
      const response: LivenessResponse = {
        passed: false,
        confidence: 0,
        challenge,
        age_estimate: null,
        session_id: sessionId,
      };
      self.postMessage(response);
      return;
    }

    const confidence = detections.detection.score;
    const expressions = detections.expressions;
    const age = Math.round(detections.age);

    let passed = false;

    if (challenge === 'blink') {
      // Detect blink via eye aspect ratio from landmarks
      const landmarks = detections.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const leftEAR = eyeAspectRatio(leftEye);
      const rightEAR = eyeAspectRatio(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2;

      passed = avgEAR < 0.25 || expressions.surprised > 0.3; // blink or surprised
    } else if (challenge === 'nod') {
      // Simplified nod detection — use neutral/happy expression as proxy
      passed = expressions.neutral > 0.4 || expressions.happy > 0.3;
    }

    const response: LivenessResponse = {
      passed: passed && confidence > 0.5,
      confidence,
      challenge,
      age_estimate: age,
      session_id: sessionId,
    };

    self.postMessage(response);
  } catch (err) {
    const response: LivenessResponse = {
      passed: false,
      confidence: 0,
      challenge,
      age_estimate: null,
      session_id: sessionId,
    };
    self.postMessage(response);
  }
};

function eyeAspectRatio(eye: faceapi.Point[]): number {
  if (eye.length < 6) return 0.3;
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

function dist(p1: faceapi.Point, p2: faceapi.Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
