/**
 * Centralize configuration required variables for our sdk
 */
export interface ConfigOptions {
    redisHost: string;
    redisReplicaHost: string;
    redisPassword: string;
    redisPort: number;
    debug: boolean;
    isEnableRedisTLS: boolean;
}

export class ResponseItem<T> {
    item: T | undefined;
    useCached: boolean | undefined;
}
