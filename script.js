const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // 얼굴 감지 및 데이터 가져오기
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        // 감지 결과 크기 조정
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // 캔버스 초기화 및 그리기
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        // 색상 업데이트 로직 추가
        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            // 감정별 색상 계산
            const red = Math.round(expressions.anger * 255 + expressions.happy * 255);
            const green = Math.round(expressions.happy * 255 + expressions.neutral * 255 + (1 - expressions.anger - expressions.sad - expressions.happy - expressions.neutral) * 128);
            const blue = Math.round(expressions.sad * 255 + expressions.neutral * 255);

            const textColor = `rgb(${red}, ${green}, ${blue})`;
            expressionDiv.style.color = textColor;

            // 가장 높은 확률의 표정 이름 표시
            const highestExpression = Object.keys(expressions).reduce((a, b) => 
                expressions[a] > expressions[b] ? a : b
            );
            expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
        } else {
            expressionDiv.textContent = 'No face detected';
            expressionDiv.style.color = 'white';
        }
    }, 100);
});
