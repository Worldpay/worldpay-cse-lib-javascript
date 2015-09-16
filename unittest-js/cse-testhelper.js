// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
pkcs1unpad2 = function(d,n) {
	var b = d.toByteArray();
	var i = 0;
	while(i < b.length && b[i] === 0) ++i;
		if(b.length-i != n-1 || b[i] != 2)
		return null;
	++i;
	while(b[i] !== 0)
		if(++i >= b.length) return null;
	var ret = [];
	while(++i < b.length) {
		var c = b[i] & 255;
		ret.push(c);
	}
	return ret;
};

function bytesToHex(bytes) {
	return bytes.map(function(x) {return ('0' + (x & 0xFF).toString(16)).slice(-2);}).join('');
}

function TestHelper() {
	this.cardNumber = $('<input />', {
		type: 'text'
	}).attr('data-worldpay', 'number');
	this.cvc = $('<input />', {
		type: 'text'
	}).attr('data-worldpay', 'cvc');
	this.expiryMonth = $('<input />', {
		type: 'text'
	}).attr('data-worldpay', 'exp-month');
	this.expiryYear = $('<input />', {
		type: 'text'
	}).attr('data-worldpay', 'exp-year');
	this.cardHolderName = $('<input />', {
		type: 'text'
	}).attr('data-worldpay', 'name');
	this.lastErrorCodes = [];
	this.paymentForm = null;
}

TestHelper.prototype.createPaymentForm = function() {
	var fixture = $("#qunit-fixture");
	this.paymentForm = $('<form></form>', {
		action: '#'
	})
	.append(this.cardNumber, this.cvc, this.expiryMonth, this.expiryYear, this.cardHolderName)
	.get(0);
	fixture.append(this.paymentForm);
};

TestHelper.prototype.attachForm = function() {
	var helper = this;
	Worldpay.useForm(this.paymentForm, function(errorCodes) {
		helper.lastErrorCodes = errorCodes;
	});

	QUnit.assert.ok(this.paymentForm.onsubmit, "onsubmit should be set");
};

TestHelper.prototype.submit = function() {
	this.lastErrorCodes = [];
	this.paymentForm.onsubmit();
};

TestHelper.prototype.getEncryptedData = function() {
	return this.paymentForm.querySelector('[data-worldpay="encrypted-data"]');
};

TestHelper.prototype.getErrorCodes = function() {
	return this.lastErrorCodes;
};

TestHelper.prototype.base64Tohex = function(base64) {
  return sjcl.codec.hex.fromBits(sjcl.codec.base64.toBits(base64));
};

TestHelper.prototype.decodeBase64 = function(base64) {
	return sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(base64));
};

TestHelper.prototype.decrypt = function(data, modulus, publicExponent, privateExponent) {
	var parts = data.split('.');

	var header = sjcl.codec.utf8String.fromBits(sjcl.codec.base64url.toBits(parts[0]));
	var aad = sjcl.codec.utf8String.toBits(parts[0]);
	var encryptedkeyHex = sjcl.codec.hex.fromBits(sjcl.codec.base64url.toBits(parts[1]));
	var iv = sjcl.codec.base64url.toBits(parts[2]);
	var cipherText = sjcl.codec.base64url.toBits(parts[3]);
	var tag = sjcl.codec.base64url.toBits(parts[4]);
	var encryptedData = sjcl.bitArray.concat(cipherText, tag);
	var tagLength = sjcl.bitArray.bitLength(tag);

	var rsa = new RSAKey();
	rsa.setPrivate(modulus, publicExponent, privateExponent);
	var decryptedAesKey = rsa.decrypt(encryptedkeyHex);

	var cipher = new sjcl.cipher.aes(sjcl.codec.hex.toBits(bytesToHex(decryptedAesKey)));
	var decryptedPayload = sjcl.codec.utf8String.fromBits(sjcl.mode.gcm.decrypt(cipher, encryptedData, iv, aad, tagLength));

	return JSON.parse(decryptedPayload);
};
