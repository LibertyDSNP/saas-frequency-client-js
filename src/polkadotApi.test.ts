import "@frequency-chain/api-augment";
import assert from "assert";
import { DefaultFrequencyClient} from "./defaultFrequencyClient"
import {BlockPaginationRequest} from "./frequencyClient";

// To run these tests follow README instructions
describe("Test Polkadot Frequency functionality for Msa, Schema, and Messages", () => {
    let frequencyClient : DefaultFrequencyClient
    const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

    beforeAll(async () => {
        frequencyClient = await DefaultFrequencyClient.initialize(process.env.WS_PROVIDER_URL!!, "//Alice")
    })

    afterAll(() => {
        frequencyClient.polkadotApi.disconnect()
    })

    test("should successfully create and retrieve an MSA Account", async () => {
        let createMsaResult;
        try {
            createMsaResult = await frequencyClient.createMsa();
            assert.equal(createMsaResult.result,true);
            const x = await frequencyClient.polkadotApi.rpc.state.getStorage(
                frequencyClient.polkadotApi.query.system.account.key(ALICE)
            );
            console.log(x);
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            if (createMsaResult) {
                createMsaResult.unsubscribe();
            }
        }
    },15000)

    test("should successfully get the msa Account for a specific keyring", async () => {
        let createMsaResult;
        let getMsaResult;
        try {
            createMsaResult = await frequencyClient.createMsa();
            getMsaResult = await frequencyClient.getMsa()
            assert.equal(getMsaResult.result, 1)
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            if (createMsaResult) {
                createMsaResult.unsubscribe();
            }
        }
    },15000)

    test("should successfully add ipfs message", async () => {
        let addMessageResult;
        try {
            addMessageResult = await frequencyClient.addMessage("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 1, 860);
            assert.equal(addMessageResult.result, true)
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            if (addMessageResult) {
                addMessageResult.unsubscribe();
            }
        }
    },15000)

    test("should successfully get the first page of ipfs messages", async () => {
        // Adding these extra messages just insures we see multiple results from the getMessage call
        // If you ran all tests you'll see 3 new messages because the one from the previous test will
        // still be there. If you run just this test, you'll see 2 new messages.
        let addMessageResult1;
        try {
            addMessageResult1 = await frequencyClient.addMessage("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 1, 860);
        } finally {
            if (addMessageResult1) {
                addMessageResult1.unsubscribe();
            }
        }

        let addMessageResult2;
        try {
            addMessageResult2 = await frequencyClient.addMessage("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 1, 860);
        } finally {
            if (addMessageResult2) {
                addMessageResult2.unsubscribe();
            }
        }

        const pagination: BlockPaginationRequest = {
            from_block: 0,
            from_index: 0,
            page_size: 25,
            to_block: 1000,
        };
        const retrieveMessageResult = await frequencyClient.getMessages(
            1,
            pagination
        );
        // This log statement shows that we are getting back the message data, although the cids are encoded
        console.log(retrieveMessageResult.result)

    },15000)
})