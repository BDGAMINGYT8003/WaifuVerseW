const axios = require('axios');

const MAX_RETRIES = 3;

// API configurations
const APIS = [
    {
        url: 'https://nekos.best/api/v2/kitsune',
        getImageUrl: (response) => response.data?.results?.[0]?.url
    },
    {
        url: 'https://purrbot.site/api/img/sfw/kitsune/img',
        getImageUrl: (response) => response.data?.link
    }
];

// Keep track of last used API index
let lastUsedApiIndex = 1; // Start with index 1 so first call uses index 0

module.exports = {
    name: 'kitsune',
    description: 'Get a random SFW kitsune image',
    async execute(ctx) {
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            try {
                attempts++;
                
                // Select the opposite API from the last used one
                const currentApiIndex = lastUsedApiIndex === 0 ? 1 : 0;
                const selectedApi = APIS[currentApiIndex];
                console.log(`Attempting with API: ${selectedApi.url}`);

                const response = await axios.get(selectedApi.url);
                const imgUrl = selectedApi.getImageUrl(response);

                if (response.status === 200 && imgUrl) {
                    await ctx.replyWithPhoto(imgUrl, {
                        caption: `🦊 Here's a beautiful kitsune image for you!\n\n[Click here if the image doesn't load properly](${imgUrl})`,
                        parse_mode: 'Markdown'
                    });
                    
                    // Update the last used API index after successful call
                    lastUsedApiIndex = currentApiIndex;
                    console.log(`Successfully fetched image from ${selectedApi.url}`);
                    return;
                } else {
                    throw new Error(`Invalid response structure from ${selectedApi.url}`);
                }
            } catch (error) {
                console.error(`Attempt ${attempts} - Error fetching kitsune image:`, error.message);
                
                // Add more detailed error logging
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    console.error('API URL:', error.config?.url);
                }
                
                if (attempts === MAX_RETRIES) {
                    await ctx.reply('*Oops!* I couldn\'t fetch a kitsune image at the moment. Please try again later.', {
                        parse_mode: 'Markdown'
                    });
                }
                
                // Short delay before next attempt
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
};