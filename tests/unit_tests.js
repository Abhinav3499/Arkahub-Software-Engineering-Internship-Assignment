const assert = require('assert');
const crypto = require('crypto');
const { generateSignature, fetchBatch, generateSerialNumbers } = require('../client/client');

console.log('Unit Test for EnergyGrid Client\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, testFn) {
    totalTests++;
    try {
        const promise = testFn();
        if (promise instanceof Promise) {
            promise.then(() => {
                console.log(`PASS: ${name}`);
                passedTests++;
            }).catch(err => {
                console.error(`FAIL: ${name}`);
                console.error('   ', err.message);
            });
            return promise;
        } else {
            console.log(`PASS: ${name}`);
            passedTests++;
        }
    } catch (err) {
        console.error(`FAIL: ${name}`);
        console.error('   ', err.message);
    }
}

// Test Serial Number Generation
runTest('generateSerialNumbers creates correct count and format', () => {
    const list = generateSerialNumbers(50);
    assert.strictEqual(list.length, 50, 'Should generate 50 items');
    assert.strictEqual(list[0], 'SN-000', 'First item format incorrect');
    assert.strictEqual(list[49], 'SN-049', 'Last item format incorrect');
});

// Test Signature Generation
runTest('generateSignature creates valid MD5', () => {
    const url = '/test/url';
    const token = 'secret';
    const ts = 123456;

    const expected = crypto.createHash('md5').update(url + token + ts).digest('hex');
    const actual = generateSignature(url, token, ts);

    assert.strictEqual(actual, expected, 'Signature mismatch');
});

// Test Rate Limit Retry Logic (Mocking 429)
runTest('fetchBatch retries on 429 error', async () => {
    let callCount = 0;

    const mockAxios = {
        post: async (url, payload, config) => {
            callCount++;
            if (callCount === 1) {
                const err = new Error('Too Many Requests');
                err.response = { status: 429 };
                throw err;
            }
            return { data: { data: ['success'] } };
        }
    };

    const result = await fetchBatch(['SN-001'], mockAxios);

    assert.strictEqual(callCount, 2, 'Should have called axios twice (1 retry)');
    assert.deepStrictEqual(result, { data: ['success'] }, 'Should return successful data after retry');
});

// Test Incorrect Signature / 401 Handling
runTest('fetchBatch handles 401 error gracefully', async () => {
    const mockAxios = {
        post: async () => {
            const err = new Error('Unauthorized');
            err.response = { status: 401, data: { error: 'Invalid Signature' } };
            throw err;
        }
    };

    const result = await fetchBatch(['SN-001'], mockAxios);
    assert.strictEqual(result, null, 'Should return null on 401 error');
});