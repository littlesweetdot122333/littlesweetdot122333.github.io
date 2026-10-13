"""Recreate the curve drawing from the supplied image.

Run this file in PyCharm. It saves bezier_bird.png beside the script and
opens the same drawing in a window. Requires matplotlib and numpy.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def bezier(t, p0, p1, p2, p3):
    """Cubic Bezier curve B(t), 0 <= t <= 1, as shown in the image."""
    t = np.asarray(t)[:, None]
    points = [np.asarray(p, dtype=float) for p in (p0, p1, p2, p3)]
    return (
        (1 - t) ** 3 * points[0]
        + 3 * (1 - t) ** 2 * t * points[1]
        + 3 * (1 - t) * t**2 * points[2]
        + t**3 * points[3]
    )


# The screenshot and the printed coordinates appear to be from different
# animation frames. False matches the visible bird; True plots the listed data.
USE_PRINTED_POINTS = False

PRINTED_CURVES = {
    "r1": [(-1.8, -3.0), (-1.2, -1.8), (-1.3, -0.8), (-2.0, 0.0)],
    "r2": [(-2.0, 0.0), (-1.4, 2.8), (2.0, 3.6), (4.8, -3.0)],
    "r3": [(4.8, -3.0), (4.2, -1.5), (3.0, 1.5), (2.5, 3.0)],
    "r4": [(-2.0, 0.8), (-2.4, 1.6), (-2.0, 2.1), (-1.6, 1.6)],
}

REFERENCE_CURVES = {
    "r1": [(-1.45, -4.0), (-0.45, -2.65), (-0.2, -1.25), (-1.35, 0.3)],
    "r2": [(-1.35, 0.3), (-0.85, 4.8), (1.95, 5.35), (4.95, -4.0)],
    "r4": [(-1.2, 1.0), (-1.65, 1.55), (-1.3, 2.15), (-0.95, 2.0)],
}


def draw():
    curves = PRINTED_CURVES if USE_PRINTED_POINTS else REFERENCE_CURVES
    fig = plt.figure(figsize=(12, 9), dpi=140, facecolor="white")
    ax = fig.add_axes((0.09, 0.39, 0.86, 0.55))
    ax.set_xlim(-4, 6.8)
    ax.set_ylim(-4.1, 3.5)
    ax.set_aspect("equal", adjustable="box")
    ax.set_xticks(np.arange(-4, 7, 1))
    ax.set_yticks(np.arange(-4, 4, 1))
    ax.grid(color="#dddddd", linestyle="--", linewidth=0.7)
    ax.tick_params(labelsize=12, length=5)

    for name, control_points in curves.items():
        xy = bezier(np.linspace(0, 1, 600), *control_points)
        ax.plot(xy[:, 0], xy[:, 1], color="black", linewidth=2.2)

    # The two parametric circles in the reference: r5 and r6.
    theta = np.linspace(0, 2 * np.pi, 500)
    circles = (((1, 2), 0.35), ((1, 2), 0.15)) if USE_PRINTED_POINTS else (
        ((0.28, 1.8), 0.56), ((0.5, 1.75), 0.27)
    )
    for (center_x, center_y), radius in circles:
        ax.plot(center_x + radius * np.cos(theta), center_y + radius * np.sin(theta),
                color="black", linewidth=2.2)

    # The horizontal line printed under the parametric formulas.
    mouth = ([-2, -1.2], -0.1) if USE_PRINTED_POINTS else ([-1.35, -0.12], 0.25)
    ax.plot(mouth[0], [mouth[1], mouth[1]], color="black", linewidth=2.2)

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_linewidth(1.3)
    ax.spines["bottom"].set_linewidth(1.3)
    ax.annotate("x", xy=(6.8, -4.1), xytext=(6.94, -4.1),
                fontsize=14, va="center", annotation_clip=False)

    fig.text(0.5, 0.31,
             r"$B(t)=(1-t)^3P_0+3(1-t)^2tP_1+3(1-t)t^2P_2+t^3P_3$"
             r"    $(0\leq t\leq1)$",
             ha="center", va="center", fontsize=18)
    descriptions = [
        f"{name}: " + ", ".join(f"({x:g},{y:g})" for x, y in points[:2])
        + "\n     " + ", ".join(f"({x:g},{y:g})" for x, y in points[2:])
        for name, points in curves.items()
    ]
    if USE_PRINTED_POINTS:
        descriptions += [
            "r5: (1+0.35 cos t, 2+0.35 sin t)\nr6: (1+0.15 cos t, 2+0.15 sin t)",
            "y = -0.1,  -2 <= x <= -1.2",
        ]
    else:
        descriptions += [
            "r5: (0.28+0.56 cos t, 1.8+0.56 sin t)",
            "r6: (0.5+0.27 cos t, 1.75+0.27 sin t)",
            "y = 0.25,  -1.35 <= x <= -0.12",
        ]
    for index, description in enumerate(descriptions):
        col, row = index % 3, index // 3
        fig.text(0.08 + 0.31 * col, 0.235 - 0.11 * row,
                 description, fontsize=10.5, va="top", family="monospace")

    output = Path(__file__).with_name("bezier_bird.png")
    fig.savefig(output, dpi=160, bbox_inches="tight")
    print(f"Saved: {output}")
    plt.show()


if __name__ == "__main__":
    draw()
