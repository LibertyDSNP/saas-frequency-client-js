import {ApiPromise, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {IU8a} from "@polkadot/types-codec/types/interfaces";
import {u16, u32, u64, u8, Vec} from "@polkadot/types";
import {options} from "@frequency-chain/api-augment";

export interface FrequencyClient{
    polkadotApi: ApiPromise,
    keyringPair: KeyringPair,
    addMessage(
        ipfsMessageSchema: number,
        ipfsMessageCid: string,
        ipfsMessageSize: number
    ) : Promise<AddMessageResult>;
    createMsa() : Promise<CreateMsaResult>;
    getMessages(
        ipfsMessageSchema: number,
        pagination: BlockPaginationRequest
    ) : Promise<GetMessagesResult>;
    getMsa() : Promise<GetMsaResult>;
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
    result: any;
    blockHash?: IU8a;
}

export interface GetMsaResult {
    result: any;
    blockHash?: IU8a;
}

export interface MessageResponse {
    providerMsaId: u64;
    index: u16;
    blockNumber: u32;
    msaId?: u64;
    payload?: u8[];
    cid?: Vec<u8>;
    payloadLength?: u32;
}

export interface BlockPaginationRequest {
    fromBlock: number;
    fromIndex: number;
    toBlock: number;
    pageSize: number;
}

export interface BlockPaginationResponse {
    content: MessageResponse[];
    hasNext: boolean;
    nextBlock?: number;
    nextIndex?: number;
}

export async function connect(providerUrl: string | string[] | undefined): Promise<ApiPromise> {
    const provider = new WsProvider(providerUrl);
    const apiObservable = new ApiPromise({ provider, ...options });
    return apiObservable.isReady;
}