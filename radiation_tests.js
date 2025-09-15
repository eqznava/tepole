// Simple unit test framework for vanilla JS
function assertEqual(actual, expected, message, tolerance = 0.01) {
    const pass = Math.abs(actual - expected) <= tolerance;
    console.log(`${pass ? 'PASS' : 'FAIL'}: ${message} (expected ${expected}, got ${actual})`);
    if (!pass) throw new Error(message);
}

function assertThrows(fn, message) {
    try {
        fn();
        console.log(`FAIL: ${message} (did not throw)`);
        throw new Error(message);
    } catch (e) {
        console.log(`PASS: ${message} (threw: ${e.message})`);
    }
}

// Test constants
const CUBE_NOMINAL_N = 2.5;
const CYLINDER_NOMINAL_N = 2.0;
const DEFAULT_B = 1.05;
const DISTANCES = [0.0, 0.3, 1.0, 2.0, 3.0];

// Sample data for tests
const SAMPLE_RS = 0.05; // e.g., cube side 0.1m
const SAMPLE_X_CONTACT = 100;
const SAMPLE_X_30 = 20; // Chosen for reasonable n ~2.2
const SAMPLE_B = 1.05;

// Expected n for sample: log(20/(100*1.05)) / log(0.05/0.35) ≈ log(0.1905)/log(0.1429) ≈ (-1.661)/(-1.946) ≈ 0.854 (wait, adjust X_30 for n~2)
// Better: solve for X_30 where n=2: X_30 = 100*1.05 * (0.05/0.35)^2 ≈ 105 * 0.0204 ≈ 2.14
// Use nominal for simplicity, and one with calculated.

// Actual calc for n=2.5 nominal, but test calc_n separately.

function runTests() {
    console.log('Running Radiation Exposure Unit Tests...\n');

    // Test calculate_n
    console.log('Testing calculate_n:');
    const expected_ratio = SAMPLE_X_30 / (SAMPLE_X_CONTACT * SAMPLE_B); // 20/105 ≈ 0.1905
    const expected_dist = SAMPLE_RS / (SAMPLE_RS + 0.30); // 0.05/0.35 ≈ 0.1429
    const expected_n = Math.log(expected_ratio) / Math.log(expected_dist); // ≈ 0.854
    assertEqual(calculate_n(SAMPLE_X_30, SAMPLE_X_CONTACT, SAMPLE_B, SAMPLE_RS), expected_n, 'calculate_n valid input', 0.001);

    assertThrows(() => calculate_n(0, SAMPLE_X_CONTACT, SAMPLE_B, SAMPLE_RS), 'calculate_n X_30 <=0');
    assertThrows(() => calculate_n(SAMPLE_X_30, 0, SAMPLE_B, SAMPLE_RS), 'calculate_n X_contact <=0');
    assertThrows(() => calculate_n(SAMPLE_X_30, SAMPLE_X_CONTACT, SAMPLE_B, 0), 'calculate_n r_s <=0');
    console.log('');

    // Test estimate_exposure
    console.log('Testing estimate_exposure:');
    assertEqual(estimate_exposure(0, SAMPLE_X_CONTACT, 2.5, SAMPLE_B, SAMPLE_RS), SAMPLE_X_CONTACT, 'estimate_exposure delta=0');

    const factor_03 = Math.pow(SAMPLE_RS / (SAMPLE_RS + 0.3), 2.5);
    const expected_03 = SAMPLE_X_CONTACT * factor_03 * SAMPLE_B;
    assertEqual(estimate_exposure(0.3, SAMPLE_X_CONTACT, 2.5, SAMPLE_B, SAMPLE_RS), expected_03, 'estimate_exposure delta=0.3', 0.01);

    assertThrows(() => estimate_exposure(0.3, 0, 2.5, SAMPLE_B, SAMPLE_RS), 'estimate_exposure X_contact <=0');
    assertThrows(() => estimate_exposure(0.3, SAMPLE_X_CONTACT, 2.5, SAMPLE_B, 0), 'estimate_exposure r_s <=0');
    assertThrows(() => estimate_exposure(-0.1, SAMPLE_X_CONTACT, 2.5, SAMPLE_B, SAMPLE_RS), 'estimate_exposure delta <0');
    console.log('');

    // Test CubeSource
    console.log('Testing CubeSource:');
    const cube = new CubeSource(0.1, SAMPLE_X_CONTACT); // r_s=0.05
    assertEqual(cube.estimate_n(), CUBE_NOMINAL_N, 'CubeSource nominal n');

    const cube_with_x30 = new CubeSource(0.1, SAMPLE_X_CONTACT);
    const n_with_x30 = cube_with_x30.estimate_n(SAMPLE_X_30, SAMPLE_B);
    assertEqual(n_with_x30, expected_n, 'CubeSource n with X_30', 0.001);

    assertEqual(cube.exposure_at(0), SAMPLE_X_CONTACT, 'CubeSource exposure at 0');
    const exp_03_cube = cube.exposure_at(0.3);
    const expected_exp_03_cube = SAMPLE_X_CONTACT * Math.pow(0.05 / 0.35, CUBE_NOMINAL_N) * SAMPLE_B;
    assertEqual(exp_03_cube, expected_exp_03_cube, 'CubeSource exposure at 0.3', 0.01);

    assertThrows(() => new CubeSource(0, SAMPLE_X_CONTACT), 'CubeSource invalid side');
    assertThrows(() => new CubeSource(0.1, 0), 'CubeSource invalid X_contact');
    console.log('');

    // Test CylinderSource
    console.log('Testing CylinderSource:');
    const cyl_side = new CylinderSource(0.1, 0.2, 'side', SAMPLE_X_CONTACT); // r_s=0.05
    assertEqual(cyl_side.estimate_n(), CYLINDER_NOMINAL_N, 'CylinderSource side nominal n');

    const cyl_top = new CylinderSource(0.1, 0.2, 'top', SAMPLE_X_CONTACT); // r_s=0.1
    assertEqual(cyl_top.r_s, 0.1, 'CylinderSource top r_s');

    const cyl_with_x30 = new CylinderSource(0.1, 0.2, 'side', SAMPLE_X_CONTACT);
    const n_cyl_x30 = cyl_with_x30.estimate_n(SAMPLE_X_30, SAMPLE_B);
    assertEqual(n_cyl_x30, expected_n, 'CylinderSource n with X_30', 0.001);

    assertEqual(cyl_side.exposure_at(0), SAMPLE_X_CONTACT, 'CylinderSource exposure at 0');
    const exp_03_cyl = cyl_side.exposure_at(0.3);
    const expected_exp_03_cyl = SAMPLE_X_CONTACT * Math.pow(0.05 / 0.35, CYLINDER_NOMINAL_N) * SAMPLE_B;
    assertEqual(exp_03_cyl, expected_exp_03_cyl, 'CylinderSource exposure at 0.3', 0.01);

    assertThrows(() => new CylinderSource(0, 0.2, 'side', SAMPLE_X_CONTACT), 'CylinderSource invalid diameter');
    assertThrows(() => new CylinderSource(0.1, 0, 'side', SAMPLE_X_CONTACT), 'CylinderSource invalid height');
    assertThrows(() => new CylinderSource(0.1, 0.2, 'invalid', SAMPLE_X_CONTACT), 'CylinderSource invalid orientation');
    assertThrows(() => new CylinderSource(0.1, 0.2, 'side', 0), 'CylinderSource invalid X_contact');

    console.log('\nAll tests passed!');
}

// Run if loaded
if (typeof module === 'undefined') {
    runTests();
}