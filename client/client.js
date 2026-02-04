const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
const API_PATH = '/device/real/query';
const API_URL = BASE_URL + API_PATH;
const AUTH_TOKEN = 'interview_token_123';
const BATCH_SIZE = 10;
const DELAY = 1000;

// To Generate md5 Signature
function generateSignature(url, token, timestamp) {
    const data = url + token + timestamp;
    return crypto.createHash('md5').update(data).digest('hex');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Dummy Serial Number Generation
function generateSerialNumbers(count) {
    const serials = [];
    for (let i = 0; i < count; i++) {
        serials.push(`SN-${String(i).padStart(3, '0')}`);
    }
    return serials;
}


async function fetchBatch(batch, _axios = axios) {
    const timestamp = Date.now();
    // Signature uses only the path, not the full URL with domain
    const signature = generateSignature(API_PATH, AUTH_TOKEN, timestamp);

    try {
        const payload = { sn_list: batch };
        const response = await _axios.post(API_URL, payload, {
            headers: {
                'timestamp': timestamp,
                'signature': signature
            }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn('Rate limit exceeded (429)');
            await sleep(2000); // Try again after 2sec delay, due to rate limit exceed 
            return fetchBatch(batch, _axios);
        }
        console.error(`Error fetching batch: ${error.message} (${error.response ? error.response.status : 'No Status'})`);
        return null;
    }
}

async function main() {
    console.log('Starting EnergyGrid Client');

    const allSerials = generateSerialNumbers(500);
    const results = [];
    let processedCount = 0;

    for (let i = 0; i < allSerials.length; i += BATCH_SIZE) {
        const batch = allSerials.slice(i, i + BATCH_SIZE);

        const data = await fetchBatch(batch);

        if (data && data.data) {
            results.push(...data.data);
        }

        processedCount += batch.length;
        console.log(`Processed ${processedCount} devices`);

        if (processedCount < 500) {
            await sleep(DELAY);
        }
    }

    console.log(`Total records fetched: ${results.length}`);
    console.log('Result sample :', results.length > 0 ? JSON.stringify(results[0], null, 2) : 'None');
    console.log('Successfully fetched all the data');
}

// Only run main if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateSignature, generateSerialNumbers, fetchBatch, sleep, main };
