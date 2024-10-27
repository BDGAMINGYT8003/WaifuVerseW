const axios = require('axios');

// Define a maximum number of retries for the API request
const MAX_RETRIES = 3;

module.exports = {
    name: 'breeding',
    description: 'Get a random NSFW breeding image or GIF',
    async execute(ctx) {
        let attempts = 0;
        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                // Make a request to the breeding API to get a random NSFW image or GIF
                const response = await axios.get('https://api.n-sfw.com/nsfw/breeding');
                // Validate the response
                if (response.status === 200 && response.data?.url) {
                    const contentUrl = response.data.url;

                    // Check if the URL is a GIF
                    if (contentUrl.endsWith('.gif')) {
                        // Send as an animation (GIF) if it's a GIF
                        await ctx.replyWithAnimation(contentUrl, {
                            caption: `🔞 Here's your NSFW breeding GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${contentUrl})`,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        // Otherwise, send as a photo (image)
                        await ctx.replyWithPhoto(contentUrl, {
                            caption: `🔞 Here's your NSFW breeding image! Please view responsibly.\n\n[Click here if the image doesn't load properly](${contentUrl})`,
                            parse_mode: 'Markdown'
                        });
                    }
                    return; // Exit the function after a successful reply
                } else {
                    throw new Error('Invalid response from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW breeding content:`, error);
                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW breeding content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};