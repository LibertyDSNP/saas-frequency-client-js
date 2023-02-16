import {ApiPromise, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {IU8a} from "@polkadot/types-codec/types/interfaces";
import {u16, u32, u64, u8, Vec} from "@polkadot/types";
import {options} from "@frequency-chain/api-augment";

export interface FrequencyClient{
    polkadotApi: ApiPromise,
    keyringPair: KeyringPair,
    addMessage: (
        ipfsMessageSchema: number,
        ipfsMessageCid: string,
        ipfsMessageSize: number
    ) => Promise<AddMessageResult>;
    createMsa: () => Promise<CreateMsaResult>;
    getMessages: (
        ipfsMessageSchema: number,
        pagination: BlockPaginationRequest
    ) => Promise<GetMessagesResult>;
    getMsa: () => Promise<GetMsaResult>;
}

export interface AddMessageResult {
    unsubscribe: () => void;
    result: boolean;
    blockHash?: IU8a;
}

export interface CreateMsaResult {
    unsubscribe: () => void;
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
    provider_msa_id: u64;
    index: u16;
    block_number: u32;
    msa_id?: u64;
    payload?: u8[];
    cid?: Vec<u8>;
    payload_length?: u32;
}

export interface BlockPaginationRequest {
    from_block: number;
    from_index: number;
    to_block: number;
    page_size: number;
}

export interface BlockPaginationResponse {
    content: MessageResponse[];
    has_next: boolean;
    next_block?: number;
    next_index?: number;
}

export async function connect(providerUrl: string | string[] | undefined): Promise<ApiPromise> {
    const provider = new WsProvider(providerUrl);
    const apiObservable = new ApiPromise({ provider, ...options });
    return apiObservable.isReady;
}