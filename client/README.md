# EnergyGrid Client

This is a Node.js client for the EnergyGrid Server.

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Setup
1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

1.  Run the server.js present in the root directory, read the setup from the README.md in the root directory. 

2.  Run the client:
    ```bash
    node client.js
    ```

## Implementation Details

-   **Batching**: Requests are sent in batches of 10 serial numbers.
-   **Rate Limiting**: logic ensures strict compliance with the 1 request/second limit by adding a `DELAY` (1000ms) between batch requests. 
-   **Security**: Each request is signed with an MD5 hash of the path, token, and timestamp.
-   **Error Handling**: Automatically retries requests when a `429 Too Many Requests` response is received, using an exponential backoff strategy.
-   **Aggregation**: Results from all batches are aggregated into a single array.

## Assumptions

-   The server returns data in the format `{ data: [ ... ] }`.
-   The API endpoint path is `/device/real/query`.

## Unit Testing 

-   Tested the client.js by writing unit tests. 
-   Navigate to tests directory from the root director by `cd tests`
-   Run unit test by `node unit_tests.js`