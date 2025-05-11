export default () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  price: {
    cacheTTL: parseInt(process.env.PRICE_CACHE_TTL, 10) || 300, // 5 minutes
    updateInterval: process.env.PRICE_UPDATE_INTERVAL || '*/5 * * * *', // every 5 minutes
    supportedSymbols: (
      process.env.SUPPORTED_SYMBOLS || 'NAM,USDC,stOSMO,stATOM,stTIA'
    ).split(','),
  },
  api: {
    coinmarketcap: {
      apiKey: process.env.CMC_API_KEY,
      baseUrl:
        process.env.CMC_BASE_URL || 'https://pro-api.coinmarketcap.com/v1',
    },
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl:
        process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',
    },
  },
});
