/**
 * Config module.
 * @module Config
 */
import { ConfigOptions } from "../type";
/**
 * Centralize your configuration in Config class
 * @class
 */
export class Config {
    public static instance: Config;
    public redisHost: string | undefined;
    public redisReplicaHost: string | undefined;
    public redisPassword: string | undefined;
    public redisPort: number | undefined;
    public debug: boolean | undefined;
    public isEnableRedisTLS: boolean | undefined;

    /**
     * private constructor follow singleton design pattern
     *
     *  @param {ConfigOptions} options - optional config object to initialize once if you want
     */
    private constructor(options?: ConfigOptions) {
        this.redisHost = options?.redisHost;
        this.redisReplicaHost = options?.redisReplicaHost;
        this.redisPassword = options?.redisPassword;
        this.redisPort = options?.redisPort;
        this.debug = options?.debug;
        this.isEnableRedisTLS = options?.isEnableRedisTLS;
    }

    /**
     * Single entry point to let consumer initial or access the shared access with singleton pattern
     *
     *  @param {ConfigOptions} configOptions - optional config object to initialize once if you want
     * @returns {Config} - Return the exiting or create a new one
     */
    public static getInstance(configOptions?: ConfigOptions): Config {
        if (!Config.instance) {
            Config.instance = new Config(configOptions);
        }
        return Config.instance;
    }
}
