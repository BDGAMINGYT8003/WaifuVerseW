const axios = require('axios');
const { Markup } = require('telegraf');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Separate API configurations for SFW and NSFW
const API_CONFIGS = {
    sfw: [
        {
            url: 'https://api.waifu.pics/sfw/neko',
            responseKey: 'url',
            weight: 1
        },
        {
            url: 'https://purrbot.site/api/img/sfw/neko/img',
            responseKey: 'link',
            weight: 1
        },
        {
            url: 'https://nekos.best/api/v2/neko',
            responseKey: 'results.0.url',
            weight: 1
        }
    ],
    nsfw: [
        {
            url: 'https://api.waifu.pics/nsfw/neko',
            responseKey: 'url',
            weight: 1
        },
        {
            url: 'https://purrbot.site/api/img/nsfw/neko/img',
            responseKey: 'link',
            weight: 1
        },
        {
            url: 'https://api.n-sfw.com/nsfw/neko',
            responseKey: 'url',
            weight: 1
        }
    ]
};

// Calculate total weights and probability ranges for each type
const calculateProbabilityRanges = (configs) => {
    const totalWeight = configs.reduce((sum, config) => sum + config.weight, 0);
    let currentRange = 0;
    
    return configs.map(config => {
        const probability = config.weight / totalWeight;
        const range = {
            min: currentRange,
            max: currentRange + probability,
            config
        };
        currentRange += probability;
        return range;
    });
};

// Select API based on weighted probability
const selectAPI = (type) => {
    const ranges = calculateProbabilityRanges(API_CONFIGS[type]);
    const random = Math.random();
    
    return ranges.find(range => random >= range.min && random < range.max).config;
};

// Get nested value from object using dot notation
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

module.exports = {
    name: 'neko',
    description: 'Fetch a random neko (cat girl) image (SFW or NSFW)',

    async execute(ctx) {
        await ctx.reply(
            'Select your preferred neko type:',
            Markup.inlineKeyboard([
                Markup.button.callback('Neko (SFW)', 'neko:sfw'),
                Markup.button.callback('Neko (NSFW)', 'neko:nsfw')
            ])
        );
    },

    actions: {
        sfw: async (ctx) => fetchNekoImage(ctx, 'sfw'),
        nsfw: async (ctx) => fetchNekoImage(ctx, 'nsfw')
    }
};

async function fetchNekoImage(ctx, type) {
    let attempts = 0;
    const usedAPIs = new Set();

    while (attempts < MAX_RETRIES) {
        try {
            attempts++;
            console.log(`Attempt ${attempts} - Fetching ${type.toUpperCase()} neko image...`);

            // Select API using weighted probability system
            let selectedAPI;
            do {
                selectedAPI = selectAPI(type);
            } while (usedAPIs.has(selectedAPI.url) && usedAPIs.size < API_CONFIGS[type].length);

            usedAPIs.add(selectedAPI.url);
            console.log(`Selected API: ${selectedAPI.url}`);

            const response = await axios.get(selectedAPI.url);
            
            if (response.status !== 200) {
                throw new Error('API returned non-200 status code');
            }

            const imageUrl = getNestedValue(response.data, selectedAPI.responseKey);
            
            if (!imageUrl) {
                throw new Error('Could not find image URL in API response');
            }

            await ctx.replyWithPhoto(imageUrl, {
                caption: getCaption(type, imageUrl),
                parse_mode: 'Markdown'
            });

            console.log(`Success - Sent ${type.toUpperCase()} neko image from ${selectedAPI.url}`);
            return;

        } catch (error) {
            console.error(`Error on attempt ${attempts} fetching ${type.toUpperCase()} neko image:`, error);

            if (attempts < MAX_RETRIES) {
                await ctx.reply(`⚠️ Attempt ${attempts} failed. Retrying with a different API...`);
                await delay(RETRY_DELAY_MS);
            } else {
                await ctx.reply(
                    `🚨 *Oops!* Unable to fetch a ${type.toUpperCase()} neko image at the moment. Please try again later. 😔`,
                    { parse_mode: 'Markdown' }
                );
            }
        }
    }
}

function getCaption(type, imageUrl) {
    return type === 'sfw'
        ? `✨ Here's your neko! Enjoy! 🐾\n\n[Click here if the image doesn't load properly](${imageUrl})`
        : `🔞 Here's your NSFW neko! Please view responsibly.\n\n[Click here if the image doesn't load properly](${imageUrl})`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}