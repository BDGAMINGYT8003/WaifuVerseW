const axios = require('axios');
const { Markup } = require('telegraf');
const { LRUCache } = require('lru-cache');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Configuration for APIs
const CONFIG = {
    MAX_RETRIES: 3,
    CONCURRENT_REQUESTS: 5,
    TIMEOUT_MS: 2000,
    CACHE_SIZE: 100,
    CACHE_TTL: 1000 * 60 * 3,
    COOLDOWN_MS: 3000,
};

// Initialize caches
const imageCache = new LRUCache({
    max: CONFIG.CACHE_SIZE,
    ttl: CONFIG.CACHE_TTL,
    allowStale: false,
    updateAgeOnGet: true,
});

const cooldownCache = new LRUCache({
    max: 1000,
    ttl: CONFIG.COOLDOWN_MS,
});

// Create axios instance for waifu.im
const waifuImApi = axios.create({
    baseURL: 'https://api.waifu.im',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
        'Accept-Version': 'v6',
        'Authorization': 'Bearer TjBY0MBcS3-SEc3Ms6T4GKjHGJkbqM6McejlQdnqo2y47jWNLa4agsWYdJukocDqHpm2zYFO5z2AjMzkUSfLsCz1AgbDhSjKLMIOnhJGFgODgOkSnzaAWzvGZZPdbm6vOTxs2chmz-3DSRVzwQLl__eYE4Wnjtr0aIGzXlo82M0',
    },
});

// Create axios instance for nekos.best
const nekosBestApi = axios.create({
    baseURL: 'https://nekos.best/api/v2',
    timeout: CONFIG.TIMEOUT_MS,
});

module.exports = {
    name: 'waifu',
    description: 'Fetch a random waifu image (SFW or NSFW)',
    
    async execute(ctx) {
        await ctx.reply(
            'Select your preferred waifu type:',
            Markup.inlineKeyboard([
                Markup.button.callback('Waifu (SFW)', 'waifu:sfw'),
                Markup.button.callback('Waifu (NSFW)', 'waifu:nsfw')
            ])
        );
    },

    actions: {
        sfw: async (ctx) => {
            // Randomly choose between waifu.pics, waifu.im, and nekos.best
            const randomChoice = Math.random();
            if (randomChoice < 0.33) {
                return fetchWaifuImImage(ctx);
            } else if (randomChoice < 0.66) {
                return fetchWaifuPicsImage(ctx, 'sfw');
            } else {
                return fetchNekosBestImage(ctx);
            }
        },
        nsfw: async (ctx) => fetchWaifuPicsImage(ctx, 'nsfw')
    }
};

// New function to fetch from nekos.best API
async function fetchNekosBestImage(ctx) {
    let attempts = 0;
    
    while (attempts < MAX_RETRIES) {
        try {
            attempts++;
            console.log(`Attempt ${attempts} - Fetching SFW waifu image from nekos.best...`);

            const response = await nekosBestApi.get('/waifu');
            
            if (response.status === 200 && response.data?.results?.[0]?.url) {
                const imageUrl = response.data.results[0].url;

                await ctx.replyWithPhoto(imageUrl, {
                    caption: getCaption('sfw', imageUrl),
                    parse_mode: 'Markdown'
                });

                console.log('Success - Sent SFW waifu image to user from nekos.best.');
                return;
            } else {
                throw new Error('Invalid response from the nekos.best API');
            }

        } catch (error) {
            console.error(`Error on attempt ${attempts} fetching SFW waifu image from nekos.best:`, error);

            if (attempts < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS);
            } else {
                await ctx.reply(
                    '🚨 *Oops!* Unable to fetch a waifu image at the moment. Please try again later. 😔',
                    { parse_mode: 'Markdown' }
                );
            }
        }
    }
}

// Fetch Waifu.pics Image Function with Retry Mechanism
async function fetchWaifuPicsImage(ctx, type) {
    let attempts = 0;
    const url = `https://api.waifu.pics/${type}/waifu`;
    
    while (attempts < MAX_RETRIES) {
        try {
            attempts++;
            console.log(`Attempt ${attempts} - Fetching ${type.toUpperCase()} waifu image from waifu.pics...`);

            const response = await axios.get(url);
            
            if (response.status === 200 && response.data?.url) {
                const imageUrl = response.data.url;

                await ctx.replyWithPhoto(imageUrl, {
                    caption: getCaption(type, imageUrl),
                    parse_mode: 'Markdown'
                });

                console.log(`Success - Sent ${type.toUpperCase()} waifu image to user from waifu.pics.`);
                return;
            } else {
                throw new Error('Invalid response from the waifu.pics API');
            }

        } catch (error) {
            console.error(`Error on attempt ${attempts} fetching ${type.toUpperCase()} waifu image from waifu.pics:`, error);

            if (attempts < MAX_RETRIES) {
                await ctx.reply(`⚠️ Attempt ${attempts} failed. Retrying...`);
                await delay(RETRY_DELAY_MS);
            } else {
                await ctx.reply(
                    `🚨 *Oops!* Unable to fetch a ${type.toUpperCase()} waifu image at the moment. Please try again later. 😔`,
                    { parse_mode: 'Markdown' }
                );
            }
        }
    }
}

// Fetch Waifu.im Image Function
async function fetchWaifuImImage(ctx) {
    const userId = ctx.from.id;

    // Check cooldown
    const remainingCooldown = cooldownCache.getRemainingTTL(userId);
    if (remainingCooldown > 0) {
        const seconds = (remainingCooldown / 1000).toFixed(1);
        return ctx.reply(
            `Please wait ${seconds} seconds before requesting another image.`,
            { parse_mode: 'Markdown' }
        );
    }

    try {
        cooldownCache.set(userId, true);
        ctx.replyWithChatAction('upload_photo');

        const response = await waifuImApi.get('/search', {
            params: { included_tags: 'waifu', is_nsfw: false }
        });

        if (!response?.data?.images?.[0]?.url) {
            throw new Error('Invalid response from waifu.im API');
        }

        const imageUrl = response.data.images[0].url;
        
        // Cache the image URL
        if (!imageCache.has(imageUrl)) {
            imageCache.set(imageUrl, true);
        }

        await ctx.replyWithPhoto(
            { url: imageUrl },
            {
                caption: getCaption('sfw', imageUrl),
                parse_mode: 'Markdown',
                disable_notification: true,
            }
        );

    } catch (error) {
        console.error('Failed to fetch waifu.im image:', error);
        await ctx.reply(
            '*Oops!* I couldn\'t fetch a waifu image at the moment. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
}

// Caption function
function getCaption(type, imageUrl) {
    return type === 'sfw'
        ? `✨ Here's your SFW waifu! Enjoy! 🐾\n\n[Click here if the image doesn't load properly](${imageUrl})`
        : `🔞 Here's your NSFW waifu! Please view responsibly.\n\n[Click here if the image doesn't load properly](${imageUrl})`;
}

// Delay function to wait between retries
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}