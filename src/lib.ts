/**
 * Normalizes the given MTProxy's secret so it would become compatible
 * with TDLib.
 *
 * @param secret Must be hexadecimal or base64url ascii string
 *
 * @returns Hex representation of the secret
 *
 * @throws {SyntaxError} If secret is neither Hex nor Base64
 * @throws {Error} If secret is too short
 */
export function fixSecret(secret: string): string {
	// oxlint-disable-next-line require-unicode-regexp
	const isHex = /^[0-9a-fA-F]+$/.test(secret) && !(secret.length & 1);

	const bytes = isHex
		? Uint8Array.fromHex(secret)
		: Uint8Array.fromBase64(secret, { alphabet: "base64url" });

	// TGAndroid does not check for length
	// if secret doesn't start with 0xEE or 0xDD,
	// which i believe leads to illegal memory access.
	if (bytes.length < 16)
		throw new Error("Secret must be at least 16 bytes long");

	const firstByte = bytes.at(0);
	switch (firstByte) {
		// 18 to 199 bytes
		case 0xee:
			return bytes
				.slice(
					0,
					// the upper bounds limit is not checked in TGAndroid,
					// i think?
					Math.max(bytes.length, 199),
				)
				.toHex();

		// 17 bytes
		case 0xdd:
			return bytes.slice(0, 17).toHex();
	}

	// 16 bytes
	return bytes.slice(0, 16).toHex();
}

export function fixLink(link: string): string {
	const { searchParams } = new URL(link),
		port = searchParams.get("port"),
		secret = searchParams.get("secret"),
		server = searchParams.get("server");

	if (!server || !port || !secret)
		throw new Error(
			"Invalid proxy link, missing server, port or secret query parameters",
		);

	const newParams = new URLSearchParams({
		server,
		port: (Number.parseInt(port, 10) & 0xffff).toString(10),
		secret: fixSecret(secret),
	});

	return `https://t.me/proxy?${newParams.toString()}`;
}
