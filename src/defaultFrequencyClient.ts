import {
  AddMessageResult,
  BlockPaginationRequest,
  BlockPaginationResponseMessageMapped,
  connect,
  CreateMsaResult,
  FrequencyClient,
  GetMessagesResult,
  GetMsaResult,
  MessageResponseMapped,
} from "./frequencyClient";
import { KeyringPair } from "@polkadot/keyring/types";
import { ApiPromise, Keyring } from "@polkadot/api";
import {
  BlockPaginationResponseMessage,
  MessageResponse,
} from "@frequency-chain/api-augment/interfaces";

export class DefaultFrequencyClient implements FrequencyClient {
  keyringPair: KeyringPair;
  polkadotApi: ApiPromise;

  private constructor(keyringPair: KeyringPair, polkadotApi: ApiPromise) {
    this.keyringPair = keyringPair;
    this.polkadotApi = polkadotApi;
  }

  public static async newInstance(providerUrl: string, suri: string) {
    const polkadotApi = await connect(providerUrl);
    const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
    const keyringPair = keyring.addFromUri(suri);
    return new DefaultFrequencyClient(keyringPair, polkadotApi);
  }

  addMessage(
    ipfsMessageCid: string,
    ipfsMessageSchema: number,
    ipfsMessageSize: number
  ): Promise<AddMessageResult> {
    const addIfsMessageExtrinsic = this.polkadotApi.tx.messages.addIpfsMessage(
      ipfsMessageSchema,
      ipfsMessageCid,
      ipfsMessageSize
    );
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<AddMessageResult>(async (resolve, reject) => {
      const unsubscribe = await addIfsMessageExtrinsic?.signAndSend(
        this.keyringPair,
        ({ events = [], status }) => {
          if (status.isFinalized) {
            if (
              events.find(({ event }) =>
                this.polkadotApi.events.messages.MessagesStored.is(event)
              ) != undefined
            ) {
              resolve({
                result: true,
                blockHash: status.asFinalized.hash,
              });
            } else {
              resolve({
                result: false,
                blockHash: undefined,
              });
            }
          }
        }
      );
      setTimeout(() => {
        unsubscribe();
      }, 20000);
    });
  }

  createMsa(): Promise<CreateMsaResult> {
    const createMsaExtrinisic = this.polkadotApi.tx.msa.create();
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<CreateMsaResult>(async (resolve, reject) => {
      const unsubscribe = await createMsaExtrinisic?.signAndSend(
        this.keyringPair,
        ({ events = [], status }) => {
          if (status.isFinalized) {
            if (
              events.find(({ event }) =>
                this.polkadotApi.events.msa.MsaCreated.is(event)
              ) != undefined
            ) {
              resolve({
                result: true,
                blockHash: status.asFinalized.hash,
              });
            } else {
              resolve({
                result: false,
                blockHash: undefined,
              });
            }
          }
        }
      );
      setTimeout(() => {
        unsubscribe();
      }, 20000);
    });
  }

  async getMessages(
    ipfsMessageSchema: number,
    pagination: BlockPaginationRequest
  ): Promise<GetMessagesResult> {
    const getMessageResult = await this.polkadotApi.rpc.messages.getBySchemaId(
      ipfsMessageSchema,
      {
        from_block: pagination.fromBlock,
        from_index: pagination.fromIndex,
        to_block: pagination.toBlock,
        page_size: pagination.pageSize,
      }
    );
    const result = this.mapBlockPaginationResponseMessage(getMessageResult);
    const blockHash = getMessageResult.createdAtHash;
    return {
      result,
      blockHash,
    };
  }

  mapBlockPaginationResponseMessage(
    message: BlockPaginationResponseMessage
  ): BlockPaginationResponseMessageMapped {
    return {
      content: message.content.map((x) => this.mapMessageResponse(x)),
      hasNext: message.has_next.toPrimitive(),
      nextBlock: message.next_block.value.isEmpty
        ? undefined
        : message.next_block.value.toNumber(),
      nextIndex: message.next_index.value.isEmpty
        ? undefined
        : message.next_index.value.toNumber(),
    };
  }

  mapMessageResponse(messageResponse: MessageResponse): MessageResponseMapped {
    return {
      providerMsaId: messageResponse.provider_msa_id,
      index: messageResponse.index.toNumber(),
      blockNumber: messageResponse.block_number.toNumber(),
      msaId: messageResponse.msa_id.value,
      payload: messageResponse.payload.value,
      cid: messageResponse.cid.value.toString(),
      payloadLength: messageResponse.payload_length.value?.toNumber(),
    };
  }

  async getMsa(): Promise<GetMsaResult> {
    const msaQueryResult = await this.polkadotApi.query.msa.publicKeyToMsaId(
      this.keyringPair.publicKey
    );

    const msaId = msaQueryResult.value.toNumber();
    const blockHash = msaQueryResult.createdAtHash;
    return {
      result: msaId,
      blockHash,
    };
  }
}
