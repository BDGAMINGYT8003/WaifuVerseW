const axios = require('axios');

// Define a maximum number of retries for the API request
const MAX_RETRIES = 3;

module.exports = {
    name: 'yuri',
    description: 'Get a random NSFW yuri image or GIF',
    async execute(ctx) {
        let attempts = 0;

        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                // Make a request to the yuri API to get a random NSFW yuri image or GIF
                const response = await axios.get('https://api.n-sfw.com/nsfw/yuri');
                
                // Validate the response
                if (response.status === 200 && response.data?.url) {
                    const yuriUrl = response.data.url;

                    // Check if the URL is a GIF
                    if (yuriUrl.endsWith('.gif')) {
                        // Send as an animation (GIF) if it's a GIF
                        await ctx.replyWithAnimation(yuriUrl, {
                            caption: `🔞 Here's your NSFW yuri GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${yuriUrl})`,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        // Otherwise, send as a photo (image)
                        await ctx.replyWithPhoto(yuriUrl, {
                            caption: `🔞 Here's your NSFW yuri image! Please view responsibly.\n\n[Click here if the image doesn't load properly](${yuriUrl})`,
                            parse_mode: 'Markdown'
                        });
                    }
                    return; // Exit the function after a successful reply
                } else {
                    throw new Error('Invalid response from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW yuri content:`, error);
                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW yuri content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};