//  Copyright (c) 2015 Worldpay. All rights reserved.
//
//  License information can be found here: https://github.com/Worldpay/worldpay-cse-lib-javascript/blob/master/LICENSE

/**
 * Returns an array of error codes that occurred.
 *
 * @callback ErrorHandler
 * @param {array} errorCodes - An array of error codes
 */

/**
 * Data structure for holding sensitive card holder details.
 * @typedef CardData
 * @type {object}
 * @property {string} cardHolderName - The name of the card holder.
 * @property {string} cardNumber - The card's PAN.
 * @property {string} expiryMonth - The 2 digit month of the card's expiry date.
 * @property {string} expiryYear - The 4 digit year of the card's expiry date.
 * @property {string} [cvc] - The optional CVC for the card.
 */

/**
 * Contains the publicly accessible interface into the Worldpay CSE library.
 * @exports {Worldpay}
 */
var worldpayCse = global.Worldpay = {};

/**
 * Attaches the Worldpay CSE encryption handler to the form onsubmit handler.
 * If the <code>form</code> parameter is omitted, then a form with <code>data-worldpay="payment-form"</code> will be used.
 *
 * @function
 * @param {object} [form] - A form object to attach the onsubmit handler to.
 * @param {ErrorHandler} [errorHandler] - An error handler which form validation error codes will be passed to.
 * @throws Throws an error if the payment form is not supplied and cannot be found in the DOM.
 */
worldpayCse.useForm = useForm;

/**
 * Encrypts the supplied card data and returns the encrypted data. If any validation error occurs, then
 * the error handler will be called with an array of the error codes and this method will
 * return null.
 *
 * @function
 * @param {CardData} cardData - An object containing information about the card details to encrypt.
 * @param {ErrorHandler} [errorHandler] - An error handler which validation error codes will be passed to.
 * @returns {string} The encrypted data to be submitted for processing, or null if a validation error occurs.
 */
worldpayCse.encrypt = encrypt;

/**
 * Sets the public key that will be used for any future
 * {@link Worldpay.encrypt} calls and {@link useForm} form submissions.
 *
 * @function
 * @param {string} publicKey - The Worldpay formatted public key as a string.
 * @throws Throws an error if the public key does not adhere to the Worldpay format.
 */
worldpayCse.setPublicKey = setPublicKey;

/**
 * Validate card details
 *
 * @function
 * @param {CardData} cardData - An object containing information about the card details to validate.
 * @returns [errorHandler] - An array of error numbers
 */
worldpayCse.validateFields = validateFields;

if (typeof global.define === "function" && global.define.amd) {
	global.define(function() {
		return worldpayCse;
	});
}

var sensitiveFields = {
	cardNumber: "number",
	cvc: "cvc",
	expiryMonth: "exp-month",
	expiryYear: "exp-year",
	cardHolderName: "name"
};

var symmetricKey = '';
var csePublicKey = '';
var cseChannel = 'javascript';
var keySeqNo = '';

function setPublicKey(publicKey) {
	var keyElements = publicKey.split( '#' );
	if ( keyElements.length != 3 ) { throw new Error('Malformed public key');}
	csePublicKey = {
		keySeqNo	:keyElements[0],
		exponent	:keyElements[1],
		modulus		:keyElements[2]
	};
}

function findDataElement(root, elementName) {
	return root.querySelector('[data-worldpay="' + elementName + '"]');
}

function useForm(arg1, arg2) {
	var paymentForm, handleError;
	if (typeof arg1 === 'object') { //Form reference passed in
		paymentForm = arg1;
		handleError = arg2;
	} else { //Search for form reference
		paymentForm = findDataElement(document, 'payment-form');
		handleError = arg1;
	}

	if (paymentForm !== null) {
		paymentForm.onsubmit = function() {
			return encryptForm(paymentForm, handleError);
		};
	} else {
		throw new Error('Payment form was not supplied, and could not be found in the DOM. Did you forget to add \'data-worldpay="payment-form"\' to your form?');
	}
}

function encryptForm(form, handleError) {
	var sensitiveData = {};
	for (var key in sensitiveFields) {
		var element = findDataElement(form, sensitiveFields[key]);
		if (!element) {
			sensitiveData[key] = '';
		} else {
			sensitiveData[key] = element.value;
		}
	}

	var encryptedData = encrypt(sensitiveData, handleError);
	var encryptedDataField = findDataElement(form, 'encrypted-data');

	if (encryptedData) {
		if (encryptedDataField !== null) {
			/*
			If the encrypted data element already exists, then we just update it so we don't add it multiple times.

			This is to prevent the following scenario:
			1. The form gets submitted
			2. User decides they wanted to pay with a different credit card and hits escape
			3. User enters different credit card details
			4. User submits form again
			5. Results are undefined and depend largely on merchant's application server
			*/
			encryptedDataField.value = encryptedData;
		} else {
			var input = document.createElement('input');
			input.type = 'hidden';
			input.setAttribute('data-worldpay', 'encrypted-data');
			input.name = 'encryptedData';
			input.value = encryptedData;
			form.appendChild(input);
		}
	}

	return (encryptedData !== null);
}

function encrypt(sensitiveData, handleError) {
	// prevent form submission if the form is not valid.
	var errorCodes = validateFields(sensitiveData);

	if (errorCodes.length > 0) {
		if (handleError && (typeof handleError === "function")) {
			handleError(errorCodes);
		}
		return null;
	}

	var unencryptedData = JSON.stringify(sensitiveData);
	return performEncryption(unencryptedData);
}

function encodeBase64FromString(data) {
	var bitData = sjcl.codec.utf8String.toBits(data);
	return sjcl.codec.base64url.fromBits(bitData);
}

function encodeBase64FromHex(data) {
	var bitData = sjcl.codec.hex.toBits(data);
	return sjcl.codec.base64url.fromBits(bitData);
}

function performEncryption(unencryptedData) {
	var header = {
		"alg":"RSA1_5",
		"enc":"A256GCM",
		"kid":csePublicKey.keySeqNo,
		"com.worldpay.apiVersion":"1.0",
		"com.worldpay.libVersion":"COM_WORLDPAY_LIBVERSION",
		"com.worldpay.channel":cseChannel
	};

	//Convert header to Base64
	var headerBase64 = encodeBase64FromString(JSON.stringify(header));

	//Do the encryption
	var encryptionResult = doAesEncryption(unencryptedData, headerBase64, 256);
	var encryptedKeyHex = doRsaEncryption(encryptionResult.symmetricKeyBytes);

	//Convert result to base64
	var encryptedKeyBase64 = encodeBase64FromHex(encryptedKeyHex);

	//Construct JWE formatted encrypted data
	var jweData = headerBase64 + '.' +
	              encryptedKeyBase64 + '.' +
	              encryptionResult.ivBase64 + '.' +
	              encryptionResult.encryptedDataBase64 + '.' +
	              encryptionResult.tagBase64;

	return jweData;
}

function hexToBytes(hex) {
	var resultLength = hex.length / 2;
	var result = new Array(resultLength);
	for (var i = 0; i < resultLength; i++) {
		result[i] = parseInt(hex.substring(i * 2, (i + 1) * 2), 16);
	}
	return result;
}

/*
 * Asymmetric key encryption
 */
function doRsaEncryption(symmetricKey) {
	var rsa = new RSAKey();
	rsa.setPublic(csePublicKey.modulus, csePublicKey.exponent);
	return rsa.encrypt(symmetricKey);
}

/*
 * Symmetric key encryption
 */
function doAesEncryption(data, aad, aesKeySize) {

	//Prepare inputs to cipher
	var key = sjcl.random.randomWords(aesKeySize / 32, 0); //Generate random AES key
	var plainText = sjcl.codec.utf8String.toBits(data);
	var iv = sjcl.random.randomWords(3, 0);
	var aadBits = sjcl.codec.utf8String.toBits(aad);
	var tagLength = 128;

	//Create cipher & perform encryption
	var blockCipher = new sjcl.cipher.aes(key);
	var gcmOutput = sjcl.mode.gcm.encrypt(blockCipher, plainText, iv, aadBits, tagLength);

	//Splice authentication tag off the end of the ciphertext
	var gcmOutputLength = sjcl.bitArray.bitLength(gcmOutput);
	var encryptedData = sjcl.bitArray.bitSlice(gcmOutput, 0, gcmOutputLength - tagLength);
	var tag = sjcl.bitArray.bitSlice(gcmOutput, gcmOutputLength - tagLength, gcmOutputLength);

	//Convert output data to correct formats
	var symmetricKeyHex = sjcl.codec.hex.fromBits(key);
	var symmetricKeyBytes = hexToBytes(symmetricKeyHex);
	var encryptedDataBase64 = sjcl.codec.base64url.fromBits(encryptedData);
	var tagBase64 = sjcl.codec.base64url.fromBits(tag);
	var ivBase64 = sjcl.codec.base64url.fromBits(iv);

	var result = {
		encryptedDataBase64: encryptedDataBase64,
		symmetricKeyBytes: symmetricKeyBytes,
		tagBase64: tagBase64,
		ivBase64: ivBase64
	};

	return result;
}

/*
 * Validate form Fields
 */
function validateFields(fields) {
	var errorsCodes = [];
	var cardNumber = fields.cardNumber;
	var cvc = fields.cvc;
	var expiryMonth = fields.expiryMonth;
	var expiryYear = fields.expiryYear;
	var cardHolderName = fields.cardHolderName;
	checkErrorCode(validateCardNumber(cardNumber), errorsCodes);
	checkErrorCode(validateCvc(cvc), errorsCodes);
	checkErrorCode(validateCardHolderName(cardHolderName), errorsCodes);

	var validMonth = checkErrorCode(validateMonth(expiryMonth), errorsCodes);
	var validYear = checkErrorCode(validateYear(expiryYear), errorsCodes);
	if (validMonth && validYear) {
		checkErrorCode(validateDate(expiryMonth, expiryYear), errorsCodes);
	}

	return errorsCodes;
}

function validateMonth(expiryMonth) {
	if(isEmpty(expiryMonth)) {
		return 301;
	}
	if(!evaluateRegex(expiryMonth, "^[0-9]{2}$")) {
		return 302;
	}
	if ((expiryMonth <= 0 || expiryMonth > 12)) {
		return 303;
	}
	return 0;
}

function validateYear(expiryYear) {
	if(isEmpty(expiryYear)) {
		return 304;
	}
	if(!evaluateRegex(expiryYear, "^[0-9]{4}$")) {
		return 305;
	}
	return 0;
}

function validateDate(expiryMonth, expiryYear) {
	if (!isFutureDate(expiryMonth, expiryYear)) {
		return 306;
	}
	return 0;
}

function isFutureDate(expiryMonth, expiryYear) {
        var now = new Date();
        var month = now.getMonth() + 1; // Date are zero based in JavaScript e.g. Jan = 0. So we convert this here.
        var year = now.getFullYear();
        return expiryYear > year || (expiryYear == year && expiryMonth >= month);
}

function validateCardHolderName(cardHolderName) {
	if(!isEmpty(cardHolderName)) {
		if(evaluateRegex(cardHolderName, "^.{1,34}$")) {
			return 0;
		} else { return 402;}
	} else { return 401;}
}
function validateCvc(cvc) {
	if(evaluateRegex(cvc, "^[0-9]{3,4}$") || isEmpty(cvc)) {
		return 0;
	} else { return 201;}
}
function validateCardNumber(cardNumber) {
	if(!isEmpty(cardNumber)) {
		if(evaluateRegex(cardNumber, "^[0-9]{12,20}$")) {
			if (doLuhnCheck(cardNumber)) { return 0;
			} else { return 103; }
		}
		else { return 102; }
	} else { return 101;}
}
function doLuhnCheck(value) {
	// The Luhn Algorithm.
	var nCheck = 0, nDigit = 0, bEven = false;value = value.replace(/\D/g, "");
	for (var n = value.length - 1; n >= 0; n--) {
	var cDigit = value.charAt(n); nDigit = parseInt(cDigit, 10);
	if (bEven) { if ((nDigit *= 2) > 9) nDigit -= 9;} nCheck += nDigit;bEven = !bEven;}
	return (nCheck % 10) === 0;
}
function checkErrorCode(errorCode, errorsCodes) {
	if( errorCode !== 0 ) {
		errorsCodes.push(errorCode);
		return false;
	} else {return true;}
}

function evaluateRegex(data, re) {
	var patt = new RegExp(re);
	return patt.test(data);
}

function isEmpty(data) {
	return (data === '' || !/[^\s]/.test(data));
}
