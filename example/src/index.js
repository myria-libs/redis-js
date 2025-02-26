import { RedisService, Config } from '@myria/redis-js';

(function () {
    const config = new Config({
        redisHost: 'localhost',
        redisPort: 6379,
        redisReplicaHost: 'localhost',
        isEnableRedisTLS: false,
        redisPassword: "localhost"
    })
    const redisService = RedisService.getInstance(config);
})();