/**
 * camera-helpers.js
 *
 * Pure, framework-free logic used by the Snap Cam app.
 * Every function here takes plain values in and returns plain values out —
 * no DOM, no `navigator`, no side effects. That's what makes it testable
 * with plain Node, the same way url-helper.js worked for QR Snap.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node / test environment
        module.exports = factory();
    } else {
        // Browser: attach to window
        root.CameraHelpers = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    /**
     * Turn a getUserMedia() error into a message a normal person can act on.
     * @param {{name?: string}} err - an Error-like object (e.g. DOMException)
     * @returns {string}
     */
    function mapGetUserMediaError(err) {
        var name = err && err.name;

        switch (name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                return 'Camera access was denied. Allow camera access in your browser settings and try again.';
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                return 'No camera was found on this device.';
            case 'NotReadableError':
            case 'TrackStartError':
                return 'The camera is already in use by another app.';
            case 'OverconstrainedError':
                return 'No camera matches the requested settings.';
            case 'SecurityError':
                return 'Camera access requires a secure (https) connection.';
            default:
                return 'Camera access was denied. Allow camera access in your browser settings and try again.';
        }
    }

    /**
     * Build a unique, filesystem-safe filename for a downloaded photo.
     * @param {number} timestamp - typically Date.now()
     * @param {string} [prefix]
     * @param {string} [extension]
     * @returns {string}
     */
    function generateFilename(timestamp, prefix, extension) {
        prefix = prefix || 'snap-cam';
        extension = extension || 'png';
        var safeTimestamp = Math.max(0, Math.floor(Number(timestamp) || 0));
        return prefix + '-' + safeTimestamp + '.' + extension;
    }

    /**
     * Given the current camera index and how many cameras exist, return the
     * next index to switch to (wraps around). Returns 0 for 0 or 1 device.
     * @param {number} currentIndex
     * @param {number} deviceCount
     * @returns {number}
     */
    function nextDeviceIndex(currentIndex, deviceCount) {
        if (!Number.isFinite(deviceCount) || deviceCount <= 1) return 0;
        var current = Number.isFinite(currentIndex) ? currentIndex : 0;
        return ((current % deviceCount) + deviceCount + 1) % deviceCount;
    }

    /**
     * Decide whether the preview/capture should be mirrored.
     * We only mirror the default front-facing camera (no explicit deviceId
     * selected yet) — once a user has explicitly picked a device, we show
     * it un-mirrored, matching how the physical camera actually sees the world.
     * @param {string|null|undefined} deviceId
     * @returns {boolean}
     */
    function shouldMirror(deviceId) {
        return !deviceId;
    }

    /**
     * Build the MediaStreamConstraints object for getUserMedia.
     * @param {string|null|undefined} deviceId
     * @returns {object}
     */
    function buildConstraints(deviceId) {
        return {
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
            audio: false
        };
    }

    /**
     * Filter a MediaDeviceInfo[] list down to video input devices only.
     * @param {Array<{kind: string}>} devices
     * @returns {Array}
     */
    function filterVideoInputs(devices) {
        if (!Array.isArray(devices)) return [];
        return devices.filter(function (d) { return d && d.kind === 'videoinput'; });
    }

    return {
        mapGetUserMediaError: mapGetUserMediaError,
        generateFilename: generateFilename,
        nextDeviceIndex: nextDeviceIndex,
        shouldMirror: shouldMirror,
        buildConstraints: buildConstraints,
        filterVideoInputs: filterVideoInputs
    };
}));
