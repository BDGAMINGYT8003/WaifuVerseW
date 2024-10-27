const axios = require('axios');
const { LRUCache } = require('lru-cache');

// Configuration settings
const CONFIG = {
    MAX_RETRIES: 3,
    CONCURRENT_REQUESTS: 5,
    TIMEOUT_MS: 2000,
    CACHE_SIZE: 100,
    CACHE_TTL: 1000 * 60 * 3,
    COOLDOWN_MS: 3000,
};

// Initialize cache with new syntax
const contentCache = new LRUCache({
    max: CONFIG.CACHE_SIZE,
    ttl: CONFIG.CACHE_TTL,
    allowStale: false,
    updateAgeOnGet: true,
});

// User cooldown cache
const cooldownCache = new LRUCache({
    max: 1000,
    ttl: CONFIG.COOLDOWN_MS,
});

// Create axios instance
const api = axios.create({
    baseURL: 'https://api.waifu.im',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
        'Accept-Version': 'v6',
        'Authorization': 'Bearer TjBY0MBcS3-SEc3Ms6T4GKjHGJkbqM6McejlQdnqo2y47jWNLa4agsWYdJukocDqHpm2zYFO5z2AjMzkUSfLsCz1AgbDhSjKLMIOnhJGFgODgOkSnzaAWzvGZZPdbm6vOTxs2chmz-3DSRVzwQLl__eYE4Wnjtr0aIGzXlo82M0',
    },
});

class CircuitBreaker {
    constructor() {
        this.failures = 0;
        this.lastFailure = 0;
        this.isOpen = false;
        this.cooldownPeriod = 3000;
    }

    async execute(fn) {
        if (this.isOpen && Date.now() - this.lastFailure <= this.cooldownPeriod) {
            throw new Error('Circuit breaker is open');
        }

        try {
            const result = await fn();
            this.reset();
            return result;
        } catch (error) {
            this.failures++;
            this.lastFailure = Date.now();
            if (this.failures >= CONFIG.MAX_RETRIES) this.isOpen = true;
            throw error;
        }
    }

    reset() {
        this.failures = 0;
        this.isOpen = false;
        this.cooldownPeriod = Math.max(1000, this.cooldownPeriod / 2);
    }
}

const circuitBreaker = new CircuitBreaker();

module.exports = {
    name: 'oral',
    description: 'Get a random oral image or GIF',
    async execute(ctx) {
        const userId = ctx.from.id;

        // Check if user is in cooldown
        const remainingCooldown = cooldownCache.getRemainingTTL(userId);
        if (remainingCooldown > 0) {
            const seconds = (remainingCooldown / 1000).toFixed(1);
            return ctx.reply(
                `Unfortunately, this API has a rate limit in place to ensure optimal performance. Please try your request again after ${seconds} seconds.`,
                { parse_mode: 'Markdown' }
            );
        }

        const fetchContent = async () => {
            let lastError;

            for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
                try {
                    const requests = Array(CONFIG.CONCURRENT_REQUESTS)
                        .fill()
                        .map(() => circuitBreaker.execute(() =>
                            api.get('/search', {
                                params: { included_tags: 'oral', is_nsfw: true },
                            })
                        ));

                    const response = await Promise.race(requests);

                    if (!response?.data?.images?.[0]?.url) throw new Error('Invalid API response');

                    const contentUrl = response.data.images[0].url;

                    if (contentCache.has(contentUrl)) continue;

                    contentCache.set(contentUrl, true);
                    return contentUrl;
                } catch (error) {
                    lastError = error;
                    await new Promise(resolve => setTimeout(resolve, 40 * 2 ** attempt));
                }
            }
            throw lastError;
        };

        try {
            // Set cooldown for user before processing request
            cooldownCache.set(userId, true);
            
            ctx.replyWithChatAction('upload_photo');

            const contentUrl = await fetchContent();
            
            // Check if the URL is a GIF
            if (contentUrl.toLowerCase().endsWith('.gif')) {
                await ctx.replyWithAnimation(
                    { url: contentUrl },
                    {
                        caption: `🔞 Here's your oral GIF!\n\n[Click here if the GIF doesn't load properly](${contentUrl})`,
                        parse_mode: 'Markdown',
                        disable_notification: true,
                    }
                );
            } else {
                await ctx.replyWithPhoto(
                    { url: contentUrl },
                    {
                        caption: `🔞 Here's your oral image! Please view responsibly. \n\n[Click here if the image doesn't load properly](${contentUrl})`,
                        parse_mode: 'Markdown',
                        disable_notification: true,
                    }
                );
            }
        } catch (error) {
            console.error('Failed to fetch oral content:', error);
            await ctx.reply('*Oops!* I couldn\'t fetch oral content at the moment. Please try again later.', {
                parse_mode: 'Markdown',
            });
        }
    }
};