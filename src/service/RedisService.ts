import Redis, { RedisOptions } from "ioredis";
import { Config } from "../config";
import { ResponseItem } from "../type";

export class RedisService {
    private readonly redisMaster: Redis;
    private readonly redisReplica: Redis;
    private readonly configService: Config;

    // Singleton instance
    private static instance: RedisService;

    private constructor(configService: Config) {
        this.configService = configService;

        const { redisHost, redisPort, redisPassword, redisReplicaHost } =
            configService;

        const option: RedisOptions = {
            host: redisHost,
            port: redisPort,
            password: redisPassword,
        };

        if (configService.isEnableRedisTLS) {
            option.tls = {};
        }

        this.redisReplica = new Redis({
            ...option,
            host: redisReplicaHost,
            role: "slave",
        });
        this.redisMaster = new Redis({ ...option, role: "master" });

        // Verify connection on startup
        this.verifyConnections();
    }

    // Static method to get singleton instance
    public static getInstance(configService?: Config): RedisService {
        if (!RedisService.instance) {
            if (!configService) {
                throw new Error(
                    "ConfigService is required for first initialization",
                );
            }
            RedisService.instance = new RedisService(configService);
        }
        return RedisService.instance;
    }

    get writer(): Redis {
        return this.redisMaster;
    }

    get reader(): Redis {
        return this.redisReplica;
    }

    async setValue(
        key: string,
        value: any,
        expireTime?: number,
    ): Promise<void> {
        const serializedValue = JSON.stringify(value);
        if (expireTime) {
            await this.redisMaster.setex(key, expireTime, serializedValue);
        } else {
            await this.redisMaster.set(key, serializedValue);
        }
    }

    async getValue<T>(key: string): Promise<T | null> {
        const value = await this.redisReplica.get(key);
        return value ? JSON.parse(value) : null;
    }

    async deleteValue(key: string): Promise<number> {
        return await this.redisMaster.del(key);
    }

    async deleteItemsByPrefixKey(
        itemPrefix = "",
    ): Promise<string[] | undefined> {
        const pattern = `${itemPrefix}*`;
        const keys = await this.redisMaster.keys(pattern);

        if (!keys || !keys.length) {
            return;
        }

        for (const key of keys) {
            await this.deleteValue(key);
        }

        return keys;
    }

    async getItemWithCache<T>(
        getCacheKey: () => string,
        getItem: () => Promise<T | null>,
        ttl?: number,
    ): Promise<ResponseItem<T | null>> {
        const cacheKey = getCacheKey();
        const cachedItem = await this.getValue<T>(cacheKey);
        if (!cachedItem) {
            const item = await getItem();
            if (item) {
                this.setValue(cacheKey, item, ttl);
            }
            return { useCached: false, item: item };
        }
        return { useCached: true, item: cachedItem };
    }

    async getValueList(keys: string[]): Promise<(string | null)[]> {
        return this.redisReplica.mget(keys);
    }

    async flushAll(): Promise<string> {
        return await this.redisMaster.flushall();
    }

    async getTTL(key: string): Promise<number> {
        return this.reader.ttl(key);
    }

    async disconnect(): Promise<void> {
        await this.redisMaster.quit();
        await this.redisReplica.quit();
    }

    private async verifyConnections(): Promise<void> {
        try {
            await Promise.all([
                this.redisMaster.ping(),
                this.redisReplica.ping(),
            ]);
            console.log("Start Redis servers successful");
        } catch (error) {
            throw new Error(`Failed to connect to Redis: ${error.message}`);
        }
    }
}
