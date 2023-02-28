import { ApiPromise, WsProvider } from "@polkadot/api";
import { IU8a } from "@polkadot/types-codec/types/interfaces";
import { options } from "@frequency-chain/api-augment";

export interface FrequencyClient {
  addMessage(
    ipfsMessageCid: string,
    ipfsMessageSchema: number,
    ipfsMessageSize: number
  ): Promise<AddMessageResult>;
  createMsa(): Promise<CreateMsaResult>;
  getMessages(
    ipfsMessageSchema: number,
    pagination: BlockPaginationRequest
  ): Promise<GetMessagesResult>;
  getMsa(): Promise<GetMsaResult>;
}

export interface AddMessageResult {
  result: boolean;
  blockHash?: IU8a;
}

export interface CreateMsaResult {
  result: boolean;
  blockHash?: IU8a;
}

export interface GetMessagesResult {
  result: BlockPaginationResponseMessageMapped;
  blockHash?: IU8a;
}

export interface GetMsaResult {
  result: number;
  blockHash?: IU8a;
}

export interface MessageResponseMapped {
  providerMsaId: number;
  index: number;
  blockNumber: number;
  msaId?: number;
  payload?: IU8a;
  cid?: String;
  payloadLength?: number;
}

export interface BlockPaginationRequest {
  fromBlock: number;
  fromIndex: number;
  toBlock: number;
  pageSize: number;
}

export interface BlockPaginationResponseMessageMapped {
  content: MessageResponseMapped[];
  hasNext: boolean;
  nextBlock?: number;
  nextIndex?: number;
}

export async function connect(
  providerUrl: string | string[] | undefined
): Promise<ApiPromise> {
  const provider = new WsProvider(providerUrl);
  const apiObservable = await ApiPromise.create({ provider, ...options });
  return apiObservable.isReady;
}
