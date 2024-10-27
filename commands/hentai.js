const axios = require('axios');

// Define a maximum number of retries for each API request
const MAX_RETRIES = 3;

// waifu.im API settings
const waifuApi = axios.create({
    baseURL: 'https://api.waifu.im',
    timeout: 2000,
    headers: {
        'Accept-Version': 'v5',
        'Authorization': 'Bearer TjBY0MBcS3-SEc3Ms6T4GKjHGJkbqM6McejlQdnqo2y47jWNLa4agsWYdJukocDqHpm2zYFO5z2AjMzkUSfLsCz1AgbDhSjKLMIOnhJGFgODgOkSnzaAWzvGZZPdbm6vOTxs2chmz-3DSRVzwQLl__eYE4Wnjtr0aIGzXlo82M0',
    },
});

// Keep track of which API was used last
let lastUsedAPI = 'nsfw'; // Start with nsfw, next call will use waifu

module.exports = {
    name: 'hentai',
    description: 'Get a random NSFW hentai image or GIF',
    async execute(ctx) {
        let attempts = 0;

        // Helper function to fetch from n-sfw API
        const fetchFromNSFW = async () => {
            const response = await axios.get('https://api.n-sfw.com/nsfw/hentai');
            if (response.status === 200 && response.data?.url) return response.data.url;
            throw new Error('Invalid response from n-sfw API');
        };

        // Helper function to fetch from waifu.im API
        const fetchFromWaifu = async () => {
            const response = await waifuApi.get('/search', {
                params: { included_tags: 'hentai', is_nsfw: true },
            });
            if (response.data?.images?.[0]?.url) return response.data.images[0].url;
            throw new Error('Invalid response from waifu.im API');
        };

        // Loop for retries
        while (attempts < MAX_RETRIES) {
            attempts++;
            try {
                // Toggle between APIs
                lastUsedAPI = lastUsedAPI === 'nsfw' ? 'waifu' : 'nsfw';
                const hentaiUrl = lastUsedAPI === 'nsfw' ? await fetchFromNSFW() : await fetchFromWaifu();

                // Send as a GIF or image based on the URL file type
                if (hentaiUrl.endsWith('.gif')) {
                    await ctx.replyWithAnimation(hentaiUrl, {
                        caption: `🔞 Here's your NSFW hentai GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${hentaiUrl})`,
                        parse_mode: 'Markdown'
                    });
                } else {
                    await ctx.replyWithPhoto(hentaiUrl, {
                        caption: `🔞 Here's your NSFW hentai image! Please view responsibly.\n\n[Click here if the image doesn't load properly](${hentaiUrl})`,
                        parse_mode: 'Markdown'
                    });
                }
                return; // Exit function after successful reply

            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW hentai content:`, error);

                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW hentai content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};