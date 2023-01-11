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

    public static async initialize(
        providerUrl: string,
        suri: string
    ) {
        let polkadotApi = await connect(
            providerUrl
        );
        let keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
        let keyringPair = keyring.addFromUri(suri);
        return new DefaultFrequencyClient(
            keyringPair,
            polkadotApi
        );
    }

    addMessage(
        ipfsMessageCid: string,
        ipfsMessageSchema: number,
        ipfsMessageSize: number
    ): Promise<AddMessageResult>{
        const addIfsMessageExtrinsic = this.polkadotApi.tx.messages.addIpfsMessage(
            ipfsMessageSchema,
            ipfsMessageCid,
            ipfsMessageSize
        );
        return new Promise<AddMessageResult>(async (resolve, reject) => {
            const unsubscribeFunction = await addIfsMessageExtrinsic?.signAndSend(
                this.keyringPair,
                ({ events = [], status }) => {
                    console.log("Transaction status:", status.type);
                    if (status.isInBlock) {
                        console.log("Included at block hash", status.asInBlock.toHex());
                        console.log("Events:");

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
                            unsubscribe: unsubscribeFunction,
                            result: true,
                            blockHash: status.hash,
                        });
                    } else if (status.isFinalized) {
                        console.log("Finalized block hash", status.asFinalized.toHex());
                        resolve({
                            unsubscribe: unsubscribeFunction,
                            result: true,
                            blockHash: status.asFinalized.hash,
                        });
                    }
                }
            );
        });
    }

    createMsa(): Promise<CreateMsaResult> {
        const createMsaExtrinisic = this.polkadotApi.tx.msa.create();
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<CreateMsaResult>(async (resolve, reject) => {
            const unsubscribeFunction = await createMsaExtrinisic?.signAndSend(
                this.keyringPair,
                ({ events = [], status }) => {
                    console.log("Transaction status:", status.type);
                    if (status.isInBlock) {
                        console.log("Included at block hash", status.asInBlock.toHex());
                        console.log("Events:");

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
                            unsubscribe: unsubscribeFunction,
                            result: true,
                            blockHash: status.hash,
                        });
                    } else if (status.isFinalized) {
                        console.log("Finalized block hash", status.asFinalized.toHex());
                        resolve({
                            unsubscribe: unsubscribeFunction,
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
        console.log(this.keyringPair.publicKey);
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