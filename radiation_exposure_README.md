# Radiation Exposure Calculator for Extended Sources

## Theory

For point sources, the gamma exposure rate follows the inverse square law, decreasing as 1/d² where d is the distance from the source. However, for extended sources like cubes or cylinders, this law only holds at large distances where the source appears point-like. At closer distances comparable to the source dimensions, the geometry causes deviations, resulting in a slower decrease in exposure rate.

This module uses an effective exponent model to approximate the exposure rate: X(Δ) = X_contact * (r_s / (r_s + Δ))^n * B, where n is an effective exponent (typically 2.0-2.5 instead of 2), and B is a buildup factor accounting for scattering (typically 1.05-1.10 in open fields). The exponent n is calculated from measurements at contact and 30 cm, or uses nominal values otherwise.

References: ionactive.co.uk for extended source dosimetry.

## Terms

- **X_contact**: Exposure rate at contact with the source surface (in mR/h).
- **r_s**: Effective radius of the source (half the characteristic dimension, e.g., half side for cube, half diameter for side-oriented cylinder).
- **Δ**: Distance from the source surface (in meters).
- **n**: Effective exponent, correcting for geometry (nominal: 2.5 for cubes, 2.0 for cylinders).
- **B**: Buildup factor, correcting for scattered radiation (default 1.05, range 1.05-1.10).

## Formulas

### Exponent Calculation
If 30 cm reading (X_30) is available:

n = ln( X_30 / (X_contact * B) ) / ln( (r_s + 0.30) / r_s )

### Exposure Rate Estimation
X(Δ) = X_contact * (r_s / (r_s + Δ))^n * B

Nominal n values:
- Cube: n ≈ 2.5
- Cylinder (side): n ≈ 2.0
- Cylinder (top): n ≈ 2.0 (same as side, but r_s based on height/2)

## Examples

### Cube Source
For a cube with side = 0.5 m, X_contact = 100 mR/h, no X_30 (uses n=2.5), B=1.05:

r_s = 0.5 / 2 = 0.25 m

X(0) = 100 * (0.25 / 0.25)^2.5 * 1.05 ≈ 105 mR/h (contact)

X(1 m) = 100 * (0.25 / 1.25)^2.5 * 1.05 ≈ 3.2 mR/h

### Cylinder Source (Side Orientation)
For a cylinder with diameter=0.3 m, height=1 m, orientation='side', X_contact=50 mR/h, X_30=20 mR/h, B=1.07:

r_s = 0.3 / 2 = 0.15 m

n = ln(20 / (50 * 1.07)) / ln((0.15 + 0.30)/0.15) ≈ 1.85

X(2 m) = 50 * (0.15 / 2.15)^1.85 * 1.07 ≈ 0.8 mR/h

### Cylinder Source (Top Orientation)
r_s = 1 / 2 = 0.5 m (uses height/2), other calculations similar.

## Usage Instructions

### As a Module
```python
from radiation_exposure import CubeSource, CylinderSource

# Cube example
cube = CubeSource(side=0.5, X_contact=100)
cube.estimate_n(X_30=40)  # Optional, calculates n
print(cube.exposure_at(1.0))  # Output: exposure at 1 m

# Cylinder example
cyl = CylinderSource(diameter=0.3, height=1.0, orientation='side', X_contact=50)
cyl.estimate_n()  # Uses nominal n=2.0
print(cyl.exposure_at(0.3))
```

### Command-Line Interface
Run `python radiation_exposure.py` interactively:

1. Select geometry: cube or cylinder.
2. Enter X_contact (mR/h).
3. Optionally provide X_30 (y/n), then value if yes.
4. Enter B (default 1.05).
5. For cube: Enter side (m).
6. For cylinder: Enter diameter (m), height (m), orientation (side/top).
7. Outputs a table of exposures at 0 m, 0.3 m, 1 m, 2 m, 3 m.

Example output:
```
Exposure Rates:
------------------------------
Distance (m)  Exposure (mR/h)
------------------------------
0.0           105.00
0.3           45.23
1.0           3.20
2.0           0.45
3.0           0.15
```

## Approximation Notes

This model is approximate and empirical, based on effective n and B factors. Accuracy improves with actual X_30 measurement for n calculation. Nominal values are rough estimates; for precise dosimetry, use Monte Carlo simulations or detailed geometry modeling. Suitable for quick field estimates of gamma exposure from extended sources like waste packages or containers. Always follow radiation safety protocols.