const axios = require('axios');

// Define a maximum number of retries for the API request
const MAX_RETRIES = 3;

module.exports = {
    name: 'muscle',
    description: 'Get a random NSFW muscle image or GIF',
    async execute(ctx) {
        let attempts = 0;
        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                // Make a request to the muscle API to get a random NSFW muscle image or GIF
                const response = await axios.get('https://api.n-sfw.com/nsfw/muscle');
                // Validate the response
                if (response.status === 200 && response.data?.url) {
                    const muscleUrl = response.data.url;

                    // Check if the URL is a GIF
                    if (muscleUrl.endsWith('.gif')) {
                        // Send as an animation (GIF) if it's a GIF
                        await ctx.replyWithAnimation(muscleUrl, {
                            caption: `🔞 Here's your NSFW muscle GIF! Please view responsibly.\n\n[Click here if the GIF doesn't load properly](${muscleUrl})`,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        // Otherwise, send as a photo (image)
                        await ctx.replyWithPhoto(muscleUrl, {
                            caption: `🔞 Here's your NSFW muscle image! Please view responsibly.\n\n[Click here if the image doesn't load properly](${muscleUrl})`,
                            parse_mode: 'Markdown'
                        });
                    }
                    return; // Exit the function after a successful reply
                } else {
                    throw new Error('Invalid response from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching NSFW muscle content:`, error);
                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch NSFW muscle content at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};