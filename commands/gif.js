const axios = require('axios');

// Define a maximum number of retries for the API request
const MAX_RETRIES = 3;

module.exports = {
    name: 'gif',
    description: 'Get a random NSFW GIF image',
    async execute(ctx) {
        let attempts = 0;
        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                // Make a request to the GIF API to get a random NSFW GIF
                const response = await axios.get('https://api.n-sfw.com/nsfw/gif');
                // Validate the response
                if (response.status === 200 && response.data?.url) {
                    const gifUrl = response.data.url;

                    // Send the GIF as an animation
                    await ctx.replyWithAnimation(gifUrl, {
                        caption: `🔞 Here's your NSFW GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${gifUrl})`,
                        parse_mode: 'Markdown'
                    });
                    return; // Exit the function after a successful reply
                } else {
                    throw new Error('Invalid response from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW GIF content:`, error);
                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW GIF content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};