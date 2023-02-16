import "@frequency-chain/api-augment";
import assert from "assert";
import { DefaultFrequencyClient} from "./defaultFrequencyClient"
import {BlockPaginationRequest} from "./frequencyClient";
import {GenericContainer, StartedTestContainer, Wait} from "testcontainers";
import {ApiPromise, Keyring, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";

// To run these tests follow README instructions
describe("Test Polkadot Frequency functionality for Msa, Schema, and Messages", () => {
    jest.setTimeout(300000);
    let frequencyClient : DefaultFrequencyClient
    let substrate: StartedTestContainer;
    let api: ApiPromise;
    let alice: KeyringPair;
    const version = "v1.2.0"
    const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

    beforeAll(async () => {
        substrate = await new GenericContainer(
            `dsnp/instant-seal-node-with-deployed-schemas:${version}`
        )
            .withWaitStrategy(Wait.forHealthCheck())
            .withExposedPorts(30333, 9944, 9933)
            .start();
        const wsProvider = new WsProvider(
            `ws://${substrate.getHost()}:${substrate.getMappedPort(9944)}`
        );
        api = await ApiPromise.create({ provider: wsProvider });
        await api.isReady;
        console.log("It's ready!");
        const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
        alice = keyring.addFromUri("//Alice");
        frequencyClient = new DefaultFrequencyClient(alice,api)
    })

    afterAll(() => {
        api.disconnect()
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
            addMessageResult = await frequencyClient.addMessage(1,"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",860);
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
            addMessageResult1 = await frequencyClient.addMessage(1,"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",860);
        } finally {
            if (addMessageResult1) {
                addMessageResult1.unsubscribe();
            }
        }

        let addMessageResult2;
        try {
            addMessageResult2 = await frequencyClient.addMessage(1,"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 860);
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