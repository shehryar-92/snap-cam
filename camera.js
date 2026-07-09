/**
 * camera.js
 *
 * Wires the DOM and browser APIs (getUserMedia, canvas, downloads) to the
 * pure logic in camera-helpers.js. Kept deliberately thin: almost every
 * decision (error messages, filenames, device cycling, mirroring) lives in
 * camera-helpers.js so it can be unit tested without a browser.
 */
(function () {
    'use strict';

    var Helpers = window.CameraHelpers;

    // ---- Elements ----
    var statePermission = document.getElementById('state-permission');
    var stateError = document.getElementById('state-error');
    var stateActive = document.getElementById('state-active');
    var stateCaptured = document.getElementById('state-captured');
    var controlsActive = document.getElementById('controls-active');
    var controlsCaptured = document.getElementById('controls-captured');

    var btnTurnOn = document.getElementById('btn-turn-on');
    var btnTryAgain = document.getElementById('btn-try-again');
    var btnCapture = document.getElementById('btn-capture');
    var btnSwitch = document.getElementById('btn-switch');
    var btnRetake = document.getElementById('btn-retake');
    var btnDownload = document.getElementById('btn-download');

    var video = document.getElementById('camera-video');
    var previewImage = document.getElementById('preview-image');
    var errorMessage = document.getElementById('error-message');
    var cameraFrame = document.getElementById('camera-frame');

    // ---- State ----
    var currentStream = null;
    var videoDevices = [];
    var currentDeviceIndex = 0;
    var lastCaptureBlobUrl = null;

    // ---- View helpers ----
    function showOnly(el) {
        [statePermission, stateError, stateActive, stateCaptured].forEach(function (node) {
            node.classList.toggle('hidden-state', node !== el);
        });
    }

    function stopStream() {
        if (currentStream) {
            currentStream.getTracks().forEach(function (track) { track.stop(); });
            currentStream = null;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        controlsActive.classList.add('hidden-state');
        controlsCaptured.classList.add('hidden-state');
        showOnly(stateError);
    }

    // ---- Camera control ----
    async function startCamera(deviceId) {
        stopStream();
        var constraints = Helpers.buildConstraints(deviceId);

        try {
            var stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            video.srcObject = stream;
            video.classList.toggle('mirror', Helpers.shouldMirror(deviceId));

            // Only after permission is granted can we see real device labels
            var devices = await navigator.mediaDevices.enumerateDevices();
            videoDevices = Helpers.filterVideoInputs(devices);

            if (deviceId) {
                var idx = videoDevices.findIndex(function (d) { return d.deviceId === deviceId; });
                if (idx !== -1) currentDeviceIndex = idx;
            }
            btnSwitch.style.display = videoDevices.length > 1 ? '' : 'none';

            controlsActive.classList.remove('hidden-state');
            showOnly(stateActive);
        } catch (err) {
            showError(Helpers.mapGetUserMediaError(err));
        }
    }

    function capturePhoto() {
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext('2d');

        if (video.classList.contains('mirror')) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        cameraFrame.style.backgroundColor = 'white';
        setTimeout(function () { cameraFrame.style.backgroundColor = ''; }, 100);

        canvas.toBlob(function (blob) {
            if (lastCaptureBlobUrl) URL.revokeObjectURL(lastCaptureBlobUrl);
            lastCaptureBlobUrl = URL.createObjectURL(blob);
            previewImage.src = lastCaptureBlobUrl;

            controlsActive.classList.add('hidden-state');
            controlsCaptured.classList.remove('hidden-state');
            showOnly(stateCaptured);
        }, 'image/png');
    }

    function downloadPhoto() {
        if (!lastCaptureBlobUrl) return;
        var link = document.createElement('a');
        link.href = lastCaptureBlobUrl;
        link.download = Helpers.generateFilename(Date.now());
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ---- Events ----
    btnTurnOn.addEventListener('click', function () { startCamera(); });
    btnTryAgain.addEventListener('click', function () { startCamera(); });

    btnSwitch.addEventListener('click', function () {
        if (videoDevices.length < 2) return;
        currentDeviceIndex = Helpers.nextDeviceIndex(currentDeviceIndex, videoDevices.length);
        startCamera(videoDevices[currentDeviceIndex].deviceId);
    });

    btnCapture.addEventListener('click', capturePhoto);
    btnRetake.addEventListener('click', function () {
        controlsCaptured.classList.add('hidden-state');
        controlsActive.classList.remove('hidden-state');
        showOnly(stateActive);
    });
    btnDownload.addEventListener('click', downloadPhoto);

    // Release the camera the moment the tab closes/navigates away
    window.addEventListener('beforeunload', stopStream);

    // Initial UI state
    showOnly(statePermission);
})();
