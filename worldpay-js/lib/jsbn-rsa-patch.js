/*
 * JSBN RSA Patch.
 *
 * Applies a patch to JSBN's RSA module to allow direct encryption of a byte
 * array instead of converting a string to a byte array first.
 *
 */
pkcs1pad2 = function(s,n) {
	if(n < s.length + 11) {
		throw new Error("Message too long for RSA");
	}
	var ba = new Array(n);
	var i = s.length - 1;
	while(i >= 0 && n > 0) {
		ba[--n] = s[i--];
	}
	ba[--n] = 0;
	var rng = new SecureRandom();
	var x = new Array();
	while(n > 2) { // random non-zero pad
		x[0] = 0;
		while(x[0] == 0) rng.nextBytes(x);
		ba[--n] = x[0];
	}
	ba[--n] = 2;
	ba[--n] = 0;
	return new BigInteger(ba);
}

/*
 * JSBN RSA Patch
 *
 * Replaces an intrusive alert() with a silent throw.
 *
 */
RSAKey.prototype.setPublic = function(N,E) {
	// Set the public key fields N and e from hex strings
	if(N != null && E != null && N.length > 0 && E.length > 0) {
		this.n = parseBigInt(N,16);
		this.e = parseInt(E,16);
	}
	else
		throw new Error("Invalid RSA public key");
}