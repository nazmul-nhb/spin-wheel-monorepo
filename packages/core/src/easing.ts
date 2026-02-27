/**
 * Cubic ease-out curve.
 *
 * @param t - Normalized time in [0, 1].
 * @returns Eased value in [0, 1].
 */
export function easeOutCubic(t: number): number {
	const t1 = t - 1;
	return t1 * t1 * t1 + 1;
}
