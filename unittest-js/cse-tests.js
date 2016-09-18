var testKeySequenceNumber = "1";
var testPrivateExponent = "68c125927f641a6406f109fd55ef10ade16c312429769e87847446b97ed5157c9d177ef88f1713ab4706b8a7f56c4977dc17008bab59e641491b8163ca4e87a64f19b2cf4cfe3bc301c24cd534baad74a6f92fc970e01369b5401f23cafadafee6a76a7bfe9fe0564d90501ae7fc851a620af25deb88439d56c33c5f4e0d0b79";
var testPublicExponent = "10001";
var testModulus = "78f6b481148331dd8dce16f84142eaf1b72077276e15c9471f91a16b9de58f69e5f967e00e5c334e2ae7ac3dadb34e35d194a424f353e672bcf8a78a04dad88bc25a2303a8fe6f935a456feee680687524681c35d0ededdcf2dd1f4f096784bba4613c86b577bf1cb749822312d9c40b74c8f1564bc8e58b3f6be61de4a56c5b";

var testPublickey = testKeySequenceNumber + '#' + testPublicExponent + '#' + testModulus;

var validCardNumber = "4532969635849701";
var validCvc = "123";
var validExpiryMonth = "08";
var validExpiryYear = "2090";
var validCardHolderName = "Gandalf";

var validData = {};

function setupDom() {
	window.testHelper = new TestHelper();
	testHelper.createPaymentForm();
	testHelper.attachForm();
	testHelper.cardNumber.val(validCardNumber);
	testHelper.cvc.val(validCvc);
	testHelper.expiryMonth.val(validExpiryMonth);
	testHelper.expiryYear.val(validExpiryYear);
	testHelper.cardHolderName.val(validCardHolderName);
	Worldpay.setPublicKey(testPublickey);
}

function teardownDom() {
	delete window.testHelper;
}

function setupDomAttachment() {
	window.testHelper = new TestHelper();
	testHelper.createPaymentForm();
	testHelper.cardNumber.val(validCardNumber);
	testHelper.cvc.val(validCvc);
	testHelper.expiryMonth.val(validExpiryMonth);
	testHelper.expiryYear.val(validExpiryYear);
	testHelper.cardHolderName.val(validCardHolderName);
	Worldpay.setPublicKey(testPublickey);
}

function teardownDomAttachment() {
	delete window.testHelper;
}

function setupDirect() {
	window.testHelper = new TestHelper();
	validData.cardNumber = validCardNumber;
	validData.cvc = validCvc;
	validData.expiryMonth = validExpiryMonth;
	validData.expiryYear = validExpiryYear;
	validData.cardHolderName = validCardHolderName;
	Worldpay.setPublicKey(testPublickey);
}

QUnit.module("validation", {
	beforeEach: setupDom,
	afterEach: teardownDom
});

QUnit.test("fails if card number is empty", function(assert) {
	testHelper.cardNumber.val('');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if card number is empty");
	assert.deepEqual(testHelper.getErrorCodes(), [101], "correct error code should be supplied");
});

QUnit.test("fails if card number fails regex", function(assert) {
	testHelper.cardNumber.val('a');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if card number fails regex");
	assert.deepEqual(testHelper.getErrorCodes(), [102], "correct error code should be supplied");
});

QUnit.test("fails if card number fails luhn check", function(assert) {
	testHelper.cardNumber.val('1234123412341234');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if luhn check fails");
	assert.deepEqual(testHelper.getErrorCodes(), [103], "correct error code should be supplied");
});

QUnit.test("encrypts data if cvc is empty", function(assert) {
	testHelper.cvc.val('');

	testHelper.submit();

	assert.ok(testHelper.getEncryptedData(), "should encrypt if cvc is empty");
	assert.notOk(testHelper.getErrorCodes().length, "error codes should be empty");
});

QUnit.test("fails if cvc is fails regex", function(assert) {
	testHelper.cvc.val('abc');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if cvc fails regex");
	assert.deepEqual(testHelper.getErrorCodes(), [201], "correct error code should be supplied");
});

QUnit.test("fails if month is empty", function(assert) {
	testHelper.expiryMonth.val('');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry month is empty");
	assert.deepEqual(testHelper.getErrorCodes(), [301], "correct error code should be supplied");
});

QUnit.test("fails if month is fails regex", function(assert) {
	testHelper.expiryMonth.val('abc');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry month fails regex");
	assert.deepEqual(testHelper.getErrorCodes(), [302], "correct error code should be supplied");
});

QUnit.test("fails if month is less than 1", function(assert) {
	testHelper.expiryMonth.val('00');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry month is less than 1");
	assert.deepEqual(testHelper.getErrorCodes(), [303], "correct error code should be supplied");
});

QUnit.test("fails if month is greater than 12", function(assert) {
	testHelper.expiryMonth.val('13');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry month is greater than 12");
	assert.deepEqual(testHelper.getErrorCodes(), [303], "correct error code should be supplied");
});

QUnit.test("fails if year is empty", function(assert) {
	testHelper.expiryYear.val('');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry year is empty");
	assert.deepEqual(testHelper.getErrorCodes(), [304], "correct error code should be supplied");
});

QUnit.test("fails if year fails regex", function(assert) {
	testHelper.expiryYear.val('abc');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry year fails regex");
	assert.deepEqual(testHelper.getErrorCodes(), [305], "correct error code should be supplied");
});

QUnit.test("fails if expiry date is before this month", function(assert) {
        testHelper.expiryMonth.val('12'); //January = 0 so this will be last month, 0 padded
	testHelper.expiryYear.val('2015'); //will always be 4 digits anyway (until year 10000 when this test should be updated anyway :D)

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if date is before this month");
	assert.deepEqual(testHelper.getErrorCodes(), [306], "correct error code should be supplied");
});

// INC00329847 Start
QUnit.test("succeeds if expiryDate is 1-12 months in the future", function(assert) {
	for (var monthsToAdd = 1; monthsToAdd < 13; monthsToAdd++) {
		var now = new Date();
		var currentMonth = now.getMonth() + 1; // Convert from zero based month
                var futureMonth = currentMonth + monthsToAdd;
                var year = now.getFullYear();
		if (futureMonth > 12) {
			futureMonth = futureMonth - 12;
			year = year + 1;
		}
		if (futureMonth > 24) {
			futureMonth = futureMonth - 24;
			year = year + 2;
		}
		testHelper.expiryMonth.val(('0' + (futureMonth)).slice(-2));
		testHelper.expiryYear.val(year);

		testHelper.submit();
		
	        assert.ok(testHelper.getEncryptedData(), "should succeed if date is in the future");
	        assert.notOk(testHelper.getErrorCodes().length, "error codes should be empty");
       		assert.deepEqual(testHelper.getErrorCodes(), [], "error codes should be empty");
	}
});
// INC00329847 End

QUnit.test("encrypts if expiry date is at the end of this month", function(assert) {
	var now = new Date();
	testHelper.expiryMonth.val(('0' + (now.getMonth() + 1)).slice(-2));
	testHelper.expiryYear.val(now.getFullYear());

	testHelper.submit();

	assert.ok(testHelper.getEncryptedData(), "should pass if the expiry date is the end of this month");
	assert.notOk(testHelper.getErrorCodes().length, "error codes should be empty");
});

QUnit.test("fails if card holder name is empty", function(assert) {
	testHelper.cardHolderName.val('');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if card holder name is empty");
	assert.deepEqual(testHelper.getErrorCodes(), [401], "correct error code should be supplied");
});

QUnit.test("fails if card holder name is too long", function(assert) {
	testHelper.cardHolderName.val('Mary had a little lamb, little lamb, little lamb');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if card holder name is too long");
	assert.deepEqual(testHelper.getErrorCodes(), [402], "correct error code should be supplied");
});

QUnit.test("fails if card number field is missing", function(assert) {
	testHelper.cardNumber.removeAttr('data-worldpay');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if card number field is missing");
	assert.deepEqual(testHelper.getErrorCodes(), [101], "correct error code should be supplied");
});

QUnit.test("encrypts if cvc field is missing", function(assert) {
	testHelper.cvc.removeAttr('data-worldpay');

	testHelper.submit();

	assert.ok(testHelper.getEncryptedData(), "should encrypt if cvc field is missing");
	assert.notOk(testHelper.getErrorCodes().length, "error codes should be empty");
});

QUnit.test("fails if expiry month field is missing", function(assert) {
	testHelper.expiryMonth.removeAttr('data-worldpay');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry month field is missing");
	assert.deepEqual(testHelper.getErrorCodes(), [301], "correct error code should be supplied");
});

QUnit.test("fails if expiry year field is missing", function(assert) {
	testHelper.expiryYear.removeAttr('data-worldpay');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if expiry year field is missing");
	assert.deepEqual(testHelper.getErrorCodes(), [304], "correct error code should be supplied");
});

QUnit.test("fails if name field is missing", function(assert) {
	testHelper.cardHolderName.removeAttr('data-worldpay');

	testHelper.submit();

	assert.notOk(testHelper.getEncryptedData(), "should fail if name field is missing");
	assert.deepEqual(testHelper.getErrorCodes(), [401], "correct error code should be supplied");
});

QUnit.module("DOM encryption", {
	beforeEach: setupDom,
	afterEach: teardownDom
});

QUnit.test("encrypted data written back to form", function(assert) {
	testHelper.submit();

	assert.ok(testHelper.getEncryptedData(), "encrypted data should be written back to form");
	assert.ok(testHelper.getEncryptedData().value, "encrypted data should not be empty");
});

QUnit.test("encrypted data encrypts differently each time", function(assert) {
	testHelper.submit();

	var encryptedData1 = testHelper.getEncryptedData().value;

	testHelper.submit();

	var encryptedData2 = testHelper.getEncryptedData().value;

	assert.notEqual(encryptedData1, encryptedData2, "encrypted data should encrypt differently each time");
});

QUnit.test("encrypted data decrypts correctly", function(assert) {
	testHelper.submit();

	var decryptedJson = testHelper.decrypt(testHelper.getEncryptedData().value, testModulus, testPublicExponent, testPrivateExponent);

	assert.deepEqual(decryptedJson, {
		cardNumber: validCardNumber,
		cvc: validCvc,
		expiryMonth: validExpiryMonth,
		expiryYear: validExpiryYear,
		cardHolderName: validCardHolderName,
	}, "decrypted JSON did not match encrypted values");
});

QUnit.test("should fail if public key is not valid", function(assert) {
	assert.throws(function() {
		Worldpay.setPublicKey('broken');
	}, 'should throw exception if public key is not valid');
});

QUnit.test("Prevents form submission if validation fails", function(assert) {
	testHelper.cardNumber.val('');

	assert.notOk(testHelper.paymentForm.onsubmit(), "should prevent form submission if validation fails");
});

QUnit.module("Dom attachment", {
	beforeEach: setupDomAttachment,
	afterEach: teardownDomAttachment
});

QUnit.test("Throws if attachment fails", function(assert) {
	assert.throws(function() {
		Worldpay.useForm();
	});
});

QUnit.test("Attaches to form with no arguments", function(assert) {
	testHelper.paymentForm.setAttribute('data-worldpay', 'payment-form');

	Worldpay.useForm();

	assert.ok(testHelper.paymentForm.onsubmit, "onsubmit should be set after calling useForm");
});

QUnit.test("Attaches to form with form reference", function(assert) {
	Worldpay.useForm(testHelper.paymentForm);

	assert.ok(testHelper.paymentForm.onsubmit, "onsubmit should be set after calling useForm");
});

QUnit.test("Attaches to form with error handler", function(assert) {
	var reportedErrorCodes = [];
	var errorHandler = function(errorCodes) {
		reportedErrorCodes = errorCodes;
	};

	testHelper.cardHolderName.val('');
	testHelper.paymentForm.setAttribute('data-worldpay', 'payment-form');

	Worldpay.useForm(errorHandler);
	testHelper.submit();

	assert.ok(testHelper.paymentForm.onsubmit, "onsubmit should be set after calling useForm");
	assert.ok(reportedErrorCodes.length, "error handler should be set");
});

QUnit.test("Attaches to form with form reference and error handler", function(assert) {
	var reportedErrorCodes = [];
	var errorHandler = function(errorCodes) {
		reportedErrorCodes = errorCodes;
	};

	testHelper.cardHolderName.val('');

	Worldpay.useForm(testHelper.paymentForm, errorHandler);
	testHelper.submit();

	assert.ok(testHelper.paymentForm.onsubmit, "onsubmit should be set after calling useForm");
	assert.ok(reportedErrorCodes.length, "error handler should be set");
});

QUnit.module("Javascript Direct Encryption", {
	beforeEach: setupDirect
});

QUnit.test("should fail if data fails validation", function(assert) {
	var reportedErrorCodes = [];

	validData.cvc = 'abc123';

	var encryptedData = Worldpay.encrypt(validData, function(errorCodes) {
		reportedErrorCodes = errorCodes;
	});

	assert.notOk(encryptedData, "should fail if data is invalid");
	assert.ok(reportedErrorCodes.length, "should report error codes if data is invalid");
});

QUnit.test("should encrypt valid data", function(assert) {
	var encryptedData = Worldpay.encrypt(validData);

	var decryptedJson = testHelper.decrypt(encryptedData, testModulus, testPublicExponent, testPrivateExponent);

	assert.deepEqual(decryptedJson, {
		cardNumber: validCardNumber,
		cvc: validCvc,
		expiryMonth: validExpiryMonth,
		expiryYear: validExpiryYear,
		cardHolderName: validCardHolderName,
	}, "decrypted JSON did not match encrypted values");
});
