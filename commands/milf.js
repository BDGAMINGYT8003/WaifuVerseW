const axios = require('axios');

// Define a maximum number of retries for each API request
const MAX_RETRIES = 3;

// Configure the second API
const apiWaifu = axios.create({
    baseURL: 'https://api.waifu.im',
    timeout: 2000,
    headers: {
        'Accept-Version': 'v6',
        'Authorization': 'Bearer TjBY0MBcS3-SEc3Ms6T4GKjHGJkbqM6McejlQdnqo2y47jWNLa4agsWYdJukocDqHpm2zYFO5z2AjMzkUSfLsCz1AgbDhSjKLMIOnhJGFgODgOkSnzaAWzvGZZPdbm6vOTxs2chmz-3DSRVzwQLl__eYE4Wnjtr0aIGzXlo82M0',
    },
});

module.exports = {
    name: 'milf',
    description: 'Get a random NSFW MILF image or GIF',
    async execute(ctx) {
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            try {
                attempts++;

                // Primary API request
                const responseNsfw = await axios.get('https://api.n-sfw.com/nsfw/milf');
                const responseWaifu = await apiWaifu.get('/search', { params: { included_tags: 'milf', is_nsfw: true } });

                const urls = [];

                // Collect URL from the primary API if available
                if (responseNsfw.status === 200 && responseNsfw.data?.url) {
                    urls.push(responseNsfw.data.url);
                }

                // Collect URL from the second API if available
                if (responseWaifu.status === 200 && responseWaifu.data?.images?.[0]?.url) {
                    urls.push(responseWaifu.data.images[0].url);
                }

                // Randomly select a URL from the available images
                if (urls.length > 0) {
                    const selectedUrl = urls[Math.floor(Math.random() * urls.length)];

                    if (selectedUrl.endsWith('.gif')) {
                        await ctx.replyWithAnimation(selectedUrl, {
                            caption: `🔞 Here's your NSFW MILF GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${selectedUrl})`,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        await ctx.replyWithPhoto(selectedUrl, {
                            caption: `🔞 Here's your NSFW MILF image! Please view responsibly.\n\n[Click here if the image doesn't load properly](${selectedUrl})`,
                            parse_mode: 'Markdown'
                        });
                    }
                    return; // Exit after successfully sending
                } else {
                    throw new Error('No valid URLs found from APIs');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW MILF content:`, error);

                // Inform the user if all attempts fail
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW MILF content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};