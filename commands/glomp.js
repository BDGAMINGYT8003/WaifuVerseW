const axios = require('axios');

// Define a maximum number of retries for the API request
const MAX_RETRIES = 3;

module.exports = {
    name: 'glomp',
    description: 'Get a random glomp GIF',
    async execute(ctx) {
        let attempts = 0;
        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                // Make a request to the waifu.pics API to get a random glomp GIF
                const response = await axios.get('https://api.waifu.pics/sfw/glomp');
                // Validate the response
                if (response.status === 200 && response.data?.url) {
                    const gifUrl = response.data.url;
                    // Send the glomp GIF to the chat
                    await ctx.replyWithAnimation(gifUrl, {
                        caption: `🤗 Here's a random glomp GIF for you! \n\n[Click here if the GIF doesn't load properly](${gifUrl})`,
                        parse_mode: 'Markdown'
                    });
                    return; // Exit the function after a successful reply
                } else {
                    throw new Error('Invalid response from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching glomp GIF:`, error);
                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch a glomp GIF at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};