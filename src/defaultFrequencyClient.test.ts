import "@frequency-chain/api-augment";
import assert from "assert";
import { DefaultFrequencyClient} from "./defaultFrequencyClient"
import {BlockPaginationRequest} from "./frequencyClient";
import {GenericContainer, StartedTestContainer, Wait} from "testcontainers";
import {ApiPromise, Keyring, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {options} from "@frequency-chain/api-augment";

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
        // const wsProvider = new WsProvider(
        //     `ws://${substrate.getHost()}:${substrate.getMappedPort(9944)}`
        // );
        // api = await ApiPromise.create({ provider: wsProvider, ...options});
        // await api.isReady;
        // const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
        // alice = keyring.addFromUri("//Alice");
        frequencyClient = await DefaultFrequencyClient.newInstance(`ws://${substrate.getHost()}:${substrate.getMappedPort(9944)}`, "//Alice")
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
        } catch (err) {
            throw err;
        } finally {
            if (createMsaResult) {
                createMsaResult.unsubscribe();
            }
        }
    })

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
    })

    test("should successfully add ipfs message", async () => {
        let createMsaResult;
        let getMsaResult;
        let addMessageResult;
        try {
            getMsaResult = await frequencyClient.getMsa()
            if(getMsaResult.result != 1){
                createMsaResult = await frequencyClient.createMsa();
            }
            addMessageResult = await frequencyClient.addMessage(1,"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",860);
            assert.equal(addMessageResult.result, true)
            let x = api.rpc.schemas.getBySchemaId("1")
        } catch (err) {
            throw err;
        } finally {
            if (addMessageResult) {
                addMessageResult.unsubscribe();
                createMsaResult?.unsubscribe();
            }
        }
    })

    test("should successfully get the first page of ipfs messages", async () => {
        // Adding these extra messages just insures we see multiple results from the getMessage call.
        let addMessageResult1;
        try {
            addMessageResult1 = await frequencyClient.addMessage(2,"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",860);
        } finally {
            if (addMessageResult1) {
                addMessageResult1.unsubscribe();
            }
        }

        let addMessageResult2;
        try {
            addMessageResult2 = await frequencyClient.addMessage(2,"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 860);
        } finally {
            if (addMessageResult2) {
                addMessageResult2.unsubscribe();
            }
        }

        const pagination: BlockPaginationRequest = {
            fromBlock: 0,
            fromIndex: 0,
            toBlock: 1000,
            pageSize: 25,
        };
        const retrieveMessageResult = await frequencyClient.getMessages(
            2,
            pagination
        );
        assert.equal(retrieveMessageResult.result, true)
    })
})