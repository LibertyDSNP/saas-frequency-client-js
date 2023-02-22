import {
    AddMessageResult, BlockPaginationRequest, connect,
    CreateMsaResult,
    FrequencyClient,
    GetMessagesResult,
    GetMsaResult
} from "./frequencyClient";
import {KeyringPair} from "@polkadot/keyring/types";
import {ApiPromise, Keyring} from "@polkadot/api";
import {BlockPaginationResponseMessage} from "@frequency-chain/api-augment/interfaces";

export class DefaultFrequencyClient implements FrequencyClient{
    keyringPair: KeyringPair;
    polkadotApi: ApiPromise;

    private constructor(
        keyringPair: KeyringPair,
        polkadotApi: ApiPromise
    ) {
        this.keyringPair = keyringPair;
        this.polkadotApi = polkadotApi;
    }

    public static async newInstance(
        providerUrl: string,
        suri: string
    ) {
        let polkadotApi = await connect(providerUrl)
        let keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
        let keyringPair = keyring.addFromUri(suri);
        return new DefaultFrequencyClient(
            keyringPair,
            polkadotApi
        );
    }

    addMessage(
        ipfsMessageSchema: number,
        ipfsMessageCid: string,
        ipfsMessageSize: number
    ): Promise<AddMessageResult>{
        const addIfsMessageExtrinsic = this.polkadotApi.tx.messages.addIpfsMessage(
            ipfsMessageSchema,
            ipfsMessageCid,
            ipfsMessageSize
        );
        return new Promise<AddMessageResult>(async (resolve, reject) => {
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
            }
            finally {
                unsubscribe();
            }
        });
    }

    createMsa(): Promise<CreateMsaResult> {
        const createMsaExtrinisic = this.polkadotApi.tx.msa.create();
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<CreateMsaResult>(async (resolve, reject) => {
            await createMsaExtrinisic?.signAndSend(
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
        } as GetMessagesResult;
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
        } as GetMsaResult;
    }
}