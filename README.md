# saas-frequency-client-js

# Running Tests
Tests are located in the `polkadotAPi.test.ts` file

1. If you aren't already make sure you are in the directory `saas-frequency-client-js`
2. You'll need to do an `npm install`
3. Start up the frequency instant-seal-node: `docker run -d -p 9944:9944 dsnp/instant-seal-node-with-deployed-schemas:v1.2.0`
4. Download the schemas repo: https://github.com/LibertyDSNP/schemas
5. Follow the README instructions to install and deploy the schemas
6. run `npm run test`