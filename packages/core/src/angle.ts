/**
 * Calculates the final rotation angle so that the target segment
 * lands under a pointer fixed at the TOP (0°/360°).
 *
 * @param index - Zero-based index of the winning segment.
 * @param count - Total number of segments.
 * @param extraSpins - Number of full 360° rotations to prepend.
 * @param rng - A function returning a random number in [0, 1).
 * @returns Final rotation in degrees (always positive, ≥ 360 * extraSpins).
 */
export function calculateFinalAngle(
	index: number,
	count: number,
	extraSpins: number,
	rng: () => number,
): number {
	const segmentAngle = 360 / count;

	// 10 % padding from edges
	const padding = segmentAngle * 0.1;
	const innerRange = segmentAngle - 2 * padding;
	const randomOffset = padding + rng() * innerRange;

	// The segment center sits at  index * segmentAngle.
	// To place that segment at the top (0°) after clockwise rotation the
	// wheel must rotate by:  360 - (index * segmentAngle + randomOffset)
	const targetAngle = 360 - (index * segmentAngle + randomOffset);

	return extraSpins * 360 + (((targetAngle % 360) + 360) % 360);
}
