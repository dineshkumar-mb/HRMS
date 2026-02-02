const otplib = require('otplib');
console.log('otplib keys:', Object.keys(otplib));
console.log('Has keyuri?', otplib.keyuri);
console.log('Has generateURI?', otplib.generateURI);

try {
    const { authenticator } = require('otplib/authenticator'); // Try this path if it exists? Unlikely in node_modules usually but worth a shot if mapped
    console.log('otplib/authenticator:', authenticator);
} catch (e) { console.log('Require otplib/authenticator failed'); }

console.log('otplib.default:', otplib.default);
if (otplib.default && otplib.default.authenticator) {
    console.log('Found authenticator in default export!');
}

try {
    console.log('Checking otplib.authenticator specifically...');
    if (otplib.authenticator) console.log('otplib.authenticator exists');
    else console.log('otplib.authenticator DOES NOT exist');
} catch (e) { }

console.log('Checking otplib.TOTP...');
if (otplib.TOTP) {
    const totp = new otplib.TOTP();
    console.log('TOTP instance keys:', Object.keys(totp));
    console.log('TOTP proto keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(totp)));
    console.log('Has keyuri?', totp.keyuri);
}
