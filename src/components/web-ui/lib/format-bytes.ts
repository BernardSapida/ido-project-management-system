/**
 * Bytes at human scale, for file sizes in upload UI.
 *
 * Binary units (1024), because that is what an OS file browser shows and a
 * mismatch between "4.2 MB here / 4.0 MB in Finder" reads as a bug. Bytes never
 * get a fraction - "1.0 B" is noise - and trailing zeros are stripped, so a
 * round number prints round.
 *
 * Non-finite and non-positive inputs return "0 B" rather than "NaN undefined":
 * a missing size is a display problem, not a reason to break the row.
 */
export const formatBytes = (bytes: number, fractionDigits = 1) => {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "0 B";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** exponent;
	const printed = value.toFixed(exponent === 0 ? 0 : fractionDigits).replace(/\.0+$/, "");
	return `${printed} ${units[exponent]}`;
};
