import { RedisService } from '../src/service/RedisService';
import { Config } from '../src/config/Config';
import { redisCacheKey, waitTime } from '../src/utils';
import RedisMemoryServer from 'redis-memory-server';
describe('RedisService', () => {
    let redisService: RedisService;
    let config: Config;
    // Simulator Redis Server
    let redisServer: RedisMemoryServer;

    beforeAll(async () => {
        redisServer = new RedisMemoryServer({
            autoStart: false,
            instance: {
                port: 6380, // Use a different redisPort than default to avoid conflicts
            },
        });

        await redisServer.start();
        const host = await redisServer.getHost();
        const port = await redisServer.getPort();

        // Create mock ConfigService with test Redis configuration
        config = {
            redisHost: host,
            redisPort: port,
            redisPassword: '',
        } as Config;

        // Initialize RedisService with test config
        redisService = RedisService.getInstance(config);
    });

    // Clean up after each test
    afterEach(async () => {
        await redisService.flushAll();
    });

    // Stop Redis server after all tests
    afterAll(async () => {
        await redisServer.stop();
    });

    it('should be a singleton', () => {
        const instance1 = RedisService.getInstance();
        const instance2 = RedisService.getInstance();
        expect(instance1).toBe(instance2);
    });
    describe('setValue and getValue', () => {
        it('should set and get value without expiration', async () => {
            const key = 'test-key';
            const value = { foo: 'bar' };

            await redisService.setValue(key, value);
            const result = await redisService.getValue<{ foo: string }>(key);

            expect(result).toEqual(value);
        });

        it('should set value with expiration', async () => {
            const key = 'test-key';
            const value = { foo: 'bar' };
            const expireTime = 1;

            await redisService.setValue(key, value, expireTime);
            const immediateResult = await redisService.getValue<{
                foo: string;
            }>(key);
            expect(immediateResult).toEqual(value);

            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const expiredResult = await redisService.getValue(key);
            expect(expiredResult).toBeNull();
        });

        it('should return success when set then get', async () => {
            const cacheKey = redisCacheKey('test');
            await redisService.setValue(cacheKey, {
                contractAddress: '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                starkKey:
                    '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
            });
            const cacheData = await redisService.getValue(cacheKey);
            expect(cacheData).toMatchObject({
                contractAddress: '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                starkKey:
                    '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
            });
        });
        it('should return null when set then get after expired', async () => {
            const cacheKey = redisCacheKey('test');

            await redisService.setValue(
                cacheKey,
                {
                    contractAddress:
                        '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                    starkKey:
                        '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
                },
                1,
            );
            await waitTime(2000);
            const cacheData = await redisService.getValue(cacheKey);
            expect(cacheData).toEqual(null);
        });
        it('should return null when set then delete then get', async () => {
            const cacheKey = redisCacheKey('test');
            await redisService.setValue(cacheKey, {
                contractAddress: '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                starkKey:
                    '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
            });
            await redisService.deleteValue(cacheKey);
            const cacheData = await redisService.getValue(cacheKey);
            expect(cacheData).toEqual(null);
        });
        it('should return null when set cache then flush all then get', async () => {
            const cacheKey = redisCacheKey('test');
            await redisService.setValue(cacheKey, {
                contractAddress: '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                starkKey:
                    '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
            });
            await redisService.flushAll();
            const cacheData = await redisService.getValue(cacheKey);
            expect(cacheData).toEqual(null);
        });
        it('should return null when delete keys by pattern', async () => {
            const cacheKey1 = redisCacheKey('group:test-1');
            await redisService.setValue(cacheKey1, {
                contractAddress: '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                starkKey:
                    '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
            });
            const cacheKey2 = redisCacheKey('group:test-2');
            await redisService.setValue(cacheKey2, {
                contractAddress: '0x6d04F380d868Bca04701283059155597c4C0ffD1',
                starkKey:
                    '0x7c65c1e82e2e662f728b4fa42485e3a0a5d2f346baa9455e3e70682c2094ad1',
            });
            const cacheKeyGroup = redisCacheKey('group');
            const cacheData =
                await redisService.deleteItemsByPrefixKey(cacheKeyGroup);
            expect(cacheData?.length).toEqual(2);

            expect(await redisService.getValue(cacheKey1)).toEqual(null);
            expect(await redisService.getValue(cacheKey2)).toEqual(null);
        });
    });
});
