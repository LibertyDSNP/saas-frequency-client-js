import {
  AddMessageResult,
  BlockPaginationRequest,
  BlockPaginationResponseMessageMapped,
  CreateMsaResult,
  FrequencyClient,
  GetMessagesResult,
  GetMsaResult,
  MessageResponseMapped,
  SimpleResult,
} from "./frequencyClient";
import { KeyringPair } from "@polkadot/keyring/types";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import {
  BlockPaginationResponseMessage,
  MessageResponse,
} from "@frequency-chain/api-augment/interfaces";
import { options } from "@frequency-chain/api-augment";
import { ExtrinsicStatus } from "@polkadot/types/interfaces";

interface WithUnsubscribe<T> {
  result: T;
  unsubscribe: () => void;
}

interface StatusCallback {
  callback(events: any[], status: ExtrinsicStatus): void;
}

/**
 * This should be properly Genericized later
 */
class EventFindingStatusCallback implements StatusCallback {
  private eventToFind: any;
  private readonly resolve: (
    t:
      | WithUnsubscribe<SimpleResult>
      | PromiseLike<WithUnsubscribe<SimpleResult>>
  ) => void;
  private readonly unsubscribe: () => void;
  constructor(
    event: any,
    resolve: (
      t:
        | WithUnsubscribe<SimpleResult>
        | PromiseLike<WithUnsubscribe<SimpleResult>>
    ) => void,
    unsubscribe: () => void
  ) {
    this.eventToFind = event;
    this.resolve = resolve;
    this.unsubscribe = unsubscribe;
  }

  callback(events: any[], status: ExtrinsicStatus) {
    if (status.isFinalized) {
      if (events.find(({ event }) => this.eventToFind.is(event)) != undefined) {
        this.resolve({
          result: {
            result: true,
            blockHash: status.asFinalized.hash,
          },
          unsubscribe: this.unsubscribe,
        });
      } else {
        this.resolve({
          result: {
            result: false,
          },
          unsubscribe: this.unsubscribe,
        });
      }
    }
  }
}

export class DefaultFrequencyClient implements FrequencyClient {
  private readonly keyringPair: KeyringPair;
  private readonly polkadotApi: ApiPromise;

  private constructor(keyringPair: KeyringPair, polkadotApi: ApiPromise) {
    this.keyringPair = keyringPair;
    this.polkadotApi = polkadotApi;
  }

  public static async newInstance(
    providerUrl: string,
    suri: string
  ): Promise<DefaultFrequencyClient> {
    const polkadotApi = await DefaultFrequencyClient.connect(providerUrl);
    const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
    const keyringPair = keyring.addFromUri(suri);
    return new DefaultFrequencyClient(keyringPair, polkadotApi);
  }

  private static async connect(
    providerUrl: string | string[] | undefined
  ): Promise<ApiPromise> {
    const provider = new WsProvider(providerUrl);
    const apiObservable = await ApiPromise.create({ provider, ...options });
    return apiObservable.isReady;
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
    return new Promise<WithUnsubscribe<AddMessageResult>>(
      // eslint-disable-next-line no-async-promise-executor
      async (resolve, reject) => {
        try {
          const unsubscribe = await addIfsMessageExtrinsic?.signAndSend(
            this.keyringPair,
            ({ events = [], status }) => {
              const delegate = new EventFindingStatusCallback(
                this.polkadotApi.events.messages.MessagesStored,
                resolve,
                unsubscribe
              ); //TODO, there has t be a better way
              delegate.callback(events, status);
            }
          );
        } catch (err) {
          reject(err);
        }
      }
    ).then((withUnsubscribe) => {
      withUnsubscribe.unsubscribe();
      return withUnsubscribe.result;
    });
  }

  createMsa(): Promise<CreateMsaResult> {
    const createMsaExtrinisic = this.polkadotApi.tx.msa.create();
    return new Promise<WithUnsubscribe<CreateMsaResult>>(
      // eslint-disable-next-line no-async-promise-executor
      async (resolve, reject) => {
        try {
          const unsubscribe = await createMsaExtrinisic?.signAndSend(
            this.keyringPair,
            ({ events = [], status }) => {
              const delegate = new EventFindingStatusCallback(
                this.polkadotApi.events.msa.MsaCreated,
                resolve,
                unsubscribe
              ); //TODO, there has t be a better way
              delegate.callback(events, status);
            }
          );
        } catch (err) {
          reject(err);
        }
      }
    ).then((withUnsubscribe) => {
      withUnsubscribe.unsubscribe();
      return withUnsubscribe.result;
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
