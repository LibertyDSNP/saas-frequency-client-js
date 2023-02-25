import "@frequency-chain/api-augment";
import { DefaultFrequencyClient } from "./defaultFrequencyClient";
import { BlockPaginationRequest } from "./frequencyClient";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

describe("Test Polkadot Frequency functionality for Msa, Schema, and Messages", () => {
  jest.setTimeout(150000);
  let frequencyClient: DefaultFrequencyClient;
  let substrate: StartedTestContainer;
  const version = "v1.2.1";

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
    expect(createMsaResult.result).toBe(true);
    const getMsaResult = await frequencyClient.getMsa();
    expect(getMsaResult.result).toBe(1);
  });

  afterAll(() => {
    frequencyClient.polkadotApi.disconnect();
  });

  test("should successfully get the first page of ipfs messages", async () => {
    // Adding these extra messages just insures we see multiple results from the getMessage call.
    const addMessageResult1 = await frequencyClient.addMessage(
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      2,
      860
    );
    expect(addMessageResult1.result).toBe(true)
    const addMessageResult2 = await frequencyClient.addMessage(
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      2,
      860
    );
    expect(addMessageResult2.result).toBe(true)

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
    expect(retrieveMessageResult.result.content.length).toBe(2)
  });
});
