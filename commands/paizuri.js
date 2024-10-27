const axios = require('axios');

// Define a maximum number of retries for the API request
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

module.exports = {
    name: 'paizuri',
    description: 'Get a random NSFW paizuri image or GIF',
    async execute(ctx) {
        let attempts = 0;

        // Helper function to fetch from n-sfw API
        const fetchFromNSFW = async () => {
            const response = await axios.get('https://api.n-sfw.com/nsfw/paizuri');
            if (response.status === 200 && response.data?.url) return response.data.url;
            throw new Error('Invalid response from n-sfw API');
        };

        // Helper function to fetch from waifu.im API
        const fetchFromWaifu = async () => {
            const response = await waifuApi.get('/search', {
                params: { included_tags: 'paizuri', is_nsfw: true },
            });
            if (response.data?.images?.[0]?.url) return response.data.images[0].url;
            throw new Error('Invalid response from waifu.im API');
        };

        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;

                // Randomly select which API to use (50/50 chance)
                const useNsfw = Math.random() < 0.5;
                const paizuriUrl = useNsfw ? await fetchFromNSFW() : await fetchFromWaifu();

                // Check if the URL is a GIF
                if (paizuriUrl.endsWith('.gif')) {
                    // Send as an animation (GIF) if it's a GIF
                    await ctx.replyWithAnimation(paizuriUrl, {
                        caption: `🔞 Here's your NSFW paizuri GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${paizuriUrl})`,
                        parse_mode: 'Markdown'
                    });
                } else {
                    // Otherwise, send as a photo (image)
                    await ctx.replyWithPhoto(paizuriUrl, {
                        caption: `🔞 Here's your NSFW paizuri image! Please view responsibly.\n\n[Click here if the image doesn't load properly](${paizuriUrl})`,
                        parse_mode: 'Markdown'
                    });
                }
                return; // Exit the function after a successful reply

            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW paizuri content:`, error);
                
                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW paizuri content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};