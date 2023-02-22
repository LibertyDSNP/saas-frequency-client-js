import {
  AddMessageResult,
  BlockPaginationRequest,
  connect,
  CreateMsaResult,
  FrequencyClient,
  GetMessagesResult,
  GetMsaResult,
} from "./frequencyClient";
import { KeyringPair } from "@polkadot/keyring/types";
import { ApiPromise, Keyring } from "@polkadot/api";
import { BlockPaginationResponseMessage } from "@frequency-chain/api-augment/interfaces";

export class DefaultFrequencyClient implements FrequencyClient {
  keyringPair: KeyringPair;
  polkadotApi: ApiPromise;

  constructor(keyringPair: KeyringPair, polkadotApi: ApiPromise) {
    this.keyringPair = keyringPair;
    this.polkadotApi = polkadotApi;
  }

  public static async newInstance(
    providerUrl: string,
    suri: string
  ): Promise<DefaultFrequencyClient> {
    const polkadotApi = await connect(providerUrl);
    const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
    const keyringPair = keyring.addFromUri(suri);
    return new DefaultFrequencyClient(keyringPair, polkadotApi);
  }

  addMessage(
    ipfsMessageSchema: number,
    ipfsMessageCid: string,
    ipfsMessageSize: number
  ): Promise<AddMessageResult> {
    const addIfsMessageExtrinsic = this.polkadotApi.tx.messages.addIpfsMessage(
      ipfsMessageSchema,
      ipfsMessageCid,
      ipfsMessageSize
    );
    //eslint-disable-next-line no-async-promise-executor
    return new Promise<AddMessageResult>(async (resolve, _reject) => {
      let unsubscribe;
      try {
        unsubscribe = await addIfsMessageExtrinsic?.signAndSend(
          this.keyringPair,
          ({ events = [], status }) => {
            if (status.isInBlock) {
              resolve({
                result: true,
                blockHash: status.hash,
              });
            } else if (status.isFinalized) {
              resolve({
                result: true,
                blockHash: status.asFinalized.hash,
              });
            }
          }
        );
      } finally {
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });
  }

  createMsa(): Promise<CreateMsaResult> {
    const createMsaExtrinisic = this.polkadotApi.tx.msa.create();
    //eslint-disable-next-line no-async-promise-executor
    return new Promise<CreateMsaResult>(async (resolve, _reject) => {
      let unsubscribe;
      try {
        unsubscribe = await createMsaExtrinisic?.signAndSend(
          this.keyringPair,
          ({ events = [], status }) => {
            if (status.isInBlock) {
              events.forEach(({ event: { data, method, section }, phase }) => {
                console.log(
                  "\t",
                  phase.toString(),
                  `: ${section}.${method}`,
                  data.toString()
                );
              });

              events
                .filter(({ event }) =>
                  this.polkadotApi.events.system.ExtrinsicFailed.is(event)
                )
                .forEach(
                  ({
                    event: {
                      data: [error, info],
                    },
                  }) => {
                    if ((error as any).isModule) {
                      const decoded = this.polkadotApi.registry.findMetaError(
                        (error as any).asModule
                      );
                      const { docs, method, section } = decoded;

                      console.log(`${section}.${method}: ${docs.join(" ")}`);
                    } else {
                      console.log(error.toString());
                    }
                  }
                );
              resolve({
                result: true,
                blockHash: status.hash,
              });
            } else if (status.isFinalized) {
              resolve({
                result: true,
                blockHash: status.asFinalized.hash,
              });
            }
          }
        );
      } finally {
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });
  }

  async getMessages(
    ipfsMessageSchema: number,
    pagination: BlockPaginationRequest
  ): Promise<GetMessagesResult> {
    const getMessageResult = await this.polkadotApi.rpc.messages.getBySchemaId(
      ipfsMessageSchema,
      pagination
    );

    const result: BlockPaginationResponseMessage = getMessageResult.toJSON();
    const blockHash = getMessageResult.createdAtHash;
    return {
      result,
      blockHash,
    };
  }

  async getMsa(): Promise<GetMsaResult> {
    const msaQueryResult = await this.polkadotApi.query.msa.publicKeyToMsaId(
      this.keyringPair.publicKey
    );

    const msaId = msaQueryResult.toJSON();
    const blockHash = msaQueryResult.createdAtHash;
    return {
      result: msaId,
      blockHash,
    };
  }
}
