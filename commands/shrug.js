const axios = require('axios');

// Define a maximum number of retries for the API request
const MAX_RETRIES = 3;

module.exports = {
    name: 'shrug',
    description: 'Get a random shrug reaction GIF',
    async execute(ctx) {
        let attempts = 0;
        const apiUrl = 'https://nekos.best/api/v2/shrug';

        // Loop until the maximum number of retries is reached
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                // Make a request to the Nekos API to get a random shrug reaction GIF
                const response = await axios.get(apiUrl);

                // Validate the response
                if (response.status === 200 && response.data?.results?.[0]?.url) {
                    const gifUrl = response.data.results[0].url;
                    
                    // Send the GIF to the Telegram chat with a caption
                    await ctx.replyWithAnimation(gifUrl, {
                        caption: `🤷 Here's a shrug reaction GIF! What can you do? \n\n[Click here if the GIF doesn't load properly](${gifUrl})`,
                        parse_mode: 'Markdown'
                    });
                    return; // Exit the function after a successful reply
                } else {
                    throw new Error('Invalid response from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching shrug GIF:`, error.message);

                // If it's the last attempt, inform the user
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch a shrug reaction at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};