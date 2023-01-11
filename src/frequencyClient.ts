import { IU8a } from "@polkadot/types-codec/types/interfaces";

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

export interface SimpleResult {
  result: boolean;
  blockHash?: IU8a;
}

export type AddMessageResult = SimpleResult;

export type CreateMsaResult = SimpleResult;

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
  cid?: string;
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
