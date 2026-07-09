/**
 * Plain Node.js test suite for camera-helpers.js
 * Run with: node tests/camera-helpers.test.js
 * No dependencies, no test framework — just assert + a tiny runner.
 */
const assert = require('assert');
const CameraHelpers = require('../camera-helpers.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('  \u2713 ' + name);
        passed++;
    } catch (err) {
        console.log('  \u2717 ' + name);
        console.log('      ' + err.message);
        failed++;
    }
}

console.log('mapGetUserMediaError');
test('maps NotAllowedError to a permission message', () => {
    const msg = CameraHelpers.mapGetUserMediaError({ name: 'NotAllowedError' });
    assert.ok(/denied/i.test(msg));
});
test('maps PermissionDeniedError the same as NotAllowedError', () => {
    const msg = CameraHelpers.mapGetUserMediaError({ name: 'PermissionDeniedError' });
    assert.ok(/denied/i.test(msg));
});
test('maps NotFoundError to a no-camera message', () => {
    const msg = CameraHelpers.mapGetUserMediaError({ name: 'NotFoundError' });
    assert.ok(/no camera/i.test(msg));
});
test('maps NotReadableError to an in-use message', () => {
    const msg = CameraHelpers.mapGetUserMediaError({ name: 'NotReadableError' });
    assert.ok(/already in use/i.test(msg));
});
test('maps SecurityError to an https message', () => {
    const msg = CameraHelpers.mapGetUserMediaError({ name: 'SecurityError' });
    assert.ok(/https/i.test(msg));
});
test('falls back to a safe generic message for unknown errors', () => {
    const msg = CameraHelpers.mapGetUserMediaError({ name: 'SomeWeirdBrowserQuirk' });
    assert.strictEqual(typeof msg, 'string');
    assert.ok(msg.length > 0);
});
test('handles a completely empty/undefined error without throwing', () => {
    assert.doesNotThrow(() => CameraHelpers.mapGetUserMediaError(undefined));
    assert.doesNotThrow(() => CameraHelpers.mapGetUserMediaError({}));
});

console.log('generateFilename');
test('produces a .png filename by default', () => {
    const name = CameraHelpers.generateFilename(1720000000000);
    assert.strictEqual(name, 'snap-cam-1720000000000.png');
});
test('supports a custom prefix and extension', () => {
    const name = CameraHelpers.generateFilename(123, 'photo', 'jpg');
    assert.strictEqual(name, 'photo-123.jpg');
});
test('never produces path traversal characters from a numeric timestamp', () => {
    const name = CameraHelpers.generateFilename(Date.now());
    assert.ok(!/[\/\\<>:"|?*]/.test(name), 'filename must not contain unsafe path characters');
});
test('sanitizes a negative or garbage timestamp instead of producing a broken filename', () => {
    const name = CameraHelpers.generateFilename(-999);
    assert.strictEqual(name, 'snap-cam-0.png');
    const name2 = CameraHelpers.generateFilename(NaN);
    assert.strictEqual(name2, 'snap-cam-0.png');
    const name3 = CameraHelpers.generateFilename('not-a-number');
    assert.strictEqual(name3, 'snap-cam-0.png');
});

console.log('nextDeviceIndex');
test('cycles from 0 to 1 with two devices', () => {
    assert.strictEqual(CameraHelpers.nextDeviceIndex(0, 2), 1);
});
test('wraps from the last device back to 0', () => {
    assert.strictEqual(CameraHelpers.nextDeviceIndex(1, 2), 0);
});
test('stays at 0 when there is only one device', () => {
    assert.strictEqual(CameraHelpers.nextDeviceIndex(0, 1), 0);
});
test('stays at 0 when there are zero devices (no crash)', () => {
    assert.strictEqual(CameraHelpers.nextDeviceIndex(0, 0), 0);
});
test('handles an out-of-range current index gracefully', () => {
    assert.strictEqual(CameraHelpers.nextDeviceIndex(99, 3), 1);
});
test('handles a negative current index gracefully', () => {
    const result = CameraHelpers.nextDeviceIndex(-1, 3);
    assert.ok(result >= 0 && result < 3);
});

console.log('shouldMirror');
test('mirrors when no deviceId is given (default front camera)', () => {
    assert.strictEqual(CameraHelpers.shouldMirror(undefined), true);
    assert.strictEqual(CameraHelpers.shouldMirror(null), true);
    assert.strictEqual(CameraHelpers.shouldMirror(''), true);
});
test('does not mirror once a specific device has been chosen', () => {
    assert.strictEqual(CameraHelpers.shouldMirror('device-123'), false);
});

console.log('buildConstraints');
test('requests facingMode "user" and no audio when no deviceId given', () => {
    const constraints = CameraHelpers.buildConstraints(undefined);
    assert.deepStrictEqual(constraints, { video: { facingMode: 'user' }, audio: false });
});
test('requests an exact deviceId and no audio when a deviceId is given', () => {
    const constraints = CameraHelpers.buildConstraints('abc-123');
    assert.deepStrictEqual(constraints, { video: { deviceId: { exact: 'abc-123' } }, audio: false });
});
test('never requests audio, under any input (privacy: video only)', () => {
    assert.strictEqual(CameraHelpers.buildConstraints(undefined).audio, false);
    assert.strictEqual(CameraHelpers.buildConstraints('xyz').audio, false);
});

console.log('filterVideoInputs');
test('keeps only videoinput devices', () => {
    const devices = [
        { kind: 'videoinput', deviceId: 'v1' },
        { kind: 'audioinput', deviceId: 'a1' },
        { kind: 'audiooutput', deviceId: 'o1' },
        { kind: 'videoinput', deviceId: 'v2' }
    ];
    const result = CameraHelpers.filterVideoInputs(devices);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result.map(d => d.deviceId), ['v1', 'v2']);
});
test('returns an empty array for non-array input instead of throwing', () => {
    assert.deepStrictEqual(CameraHelpers.filterVideoInputs(null), []);
    assert.deepStrictEqual(CameraHelpers.filterVideoInputs(undefined), []);
    assert.deepStrictEqual(CameraHelpers.filterVideoInputs('not an array'), []);
});
test('returns an empty array when given an empty list', () => {
    assert.deepStrictEqual(CameraHelpers.filterVideoInputs([]), []);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
