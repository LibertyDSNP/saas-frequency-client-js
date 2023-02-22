import "@frequency-chain/api-augment";
import assert from "assert";
import { DefaultFrequencyClient } from "./defaultFrequencyClient";
import { BlockPaginationRequest } from "./frequencyClient";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { options } from "@frequency-chain/api-augment";

describe("Test Polkadot Frequency functionality for Msa, Schema, and Messages", () => {
  jest.setTimeout(30000);
  let frequencyClient: DefaultFrequencyClient;
  let substrate: StartedTestContainer;
  let api: ApiPromise;
  const version = "v1.2.1";
  const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  beforeAll(async () => {
    substrate = await new GenericContainer(
      `dsnp/instant-seal-node-with-deployed-schemas:${version}`
    )
      .withWaitStrategy(Wait.forHealthCheck())
      .withExposedPorts(30333, 9944, 9933)
      .start();
    frequencyClient = await DefaultFrequencyClient.newInstance(
      `ws://${substrate.getHost()}:${substrate.getMappedPort(9944)}`,
      "//Alice"
    );
    const createMsaResult = await frequencyClient.createMsa();
    const getMsaResult = await frequencyClient.getMsa();
    expect(getMsaResult.result)
  });

  afterAll(() => {
    api.disconnect();
  });

  test("should successfully create and retrieve an MSA Account", async () => {
    const createMsaResult = await frequencyClient.createMsa();
    assert.equal(createMsaResult.result, true);
    const x = await frequencyClient.polkadotApi.rpc.state.getStorage(
      frequencyClient.polkadotApi.query.system.account.key(ALICE)
    );
  }, 15000);

  test("should successfully get the msa Account for a specific keyring", async () => {
    let createMsaResult;
    let getMsaResult;
    createMsaResult = await frequencyClient.createMsa();
    getMsaResult = await frequencyClient.getMsa();
    assert.equal(getMsaResult.result, 1);
  }, 15000);

  test("should successfully add ipfs message", async () => {
    let createMsaResult;
    let getMsaResult;
    let addMessageResult;
    getMsaResult = await frequencyClient.getMsa();
    if (getMsaResult.result != 1) {
      createMsaResult = await frequencyClient.createMsa();
    }
    addMessageResult = await frequencyClient.addMessage(
      1,
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      860
    );
    assert.equal(addMessageResult.result, true);
    const x = api.rpc.schemas.getBySchemaId("1");
  }, 15000);

  test("should successfully get the first page of ipfs messages", async () => {
    // Adding these extra messages just insures we see multiple results from the getMessage call.
    let addMessageResult1;
    addMessageResult1 = await frequencyClient.addMessage(
      2,
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      860
    );

    let addMessageResult2;
    addMessageResult2 = await frequencyClient.addMessage(
      2,
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      860
    );

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
    assert.equal(retrieveMessageResult.result, true);
  }, 15000);
});
