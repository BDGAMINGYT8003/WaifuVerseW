const axios = require('axios');

const MAX_RETRIES = 3;

module.exports = {
    name: 'baka',
    description: 'Get a random baka reaction image/gif',
    async execute(ctx) {
        let attempts = 0;
        const apiUrl = 'https://nekos.best/api/v2/baka';
        
        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                const response = await axios.get(apiUrl);
                
                // Check if response has the expected structure
                if (response.status === 200 && response.data?.results?.[0]?.url) {
                    const imgUrl = response.data.results[0].url;
                    
                    await ctx.replyWithAnimation(imgUrl, {
                        caption: `😝 Baka! Here's your reaction gif!\n\n[Click here if the animation doesn't load properly](${imgUrl})`,
                        parse_mode: 'Markdown'
                    });
                    return;
                } else {
                    throw new Error('Invalid response structure from the API');
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching baka gif:`, error.message);
                
                // Add more detailed error logging
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                }
                
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch a baka reaction at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
    }
};