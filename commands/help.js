// commands/help.js
const { Markup } = require('telegraf');

// Command categories and their emojis
const categories = {
    'CHARACTER COMMANDS': '🎭',
    'INTERACTION GIFS': '💝',
    'EMOTION GIFS': '😊',
    'SPECIAL GIFS': '✨',
    'NSFW COMMANDS': '🔞'
};

// Complete command list organized by category
const commandsByCategory = {
    'CHARACTER COMMANDS': [
        { name: 'waifu', description: 'Obtain a random waifu image' },
        { name: 'neko', description: 'Enjoy a random neko image' },
        { name: 'kitsune', description: 'Fetch a random kitsune image' },
        { name: 'maid', description: 'Get a random NSFW maid image or GIF' },
        { name: 'oppai', description: 'Get a random NSFW oppai image or GIF' },
        { name: 'uniform', description: 'Get a random NSFW uniform image or GIF' },
        { name: 'shinobu', description: 'Retrieve a random Shinobu image' },
        { name: 'megumin', description: 'Fetch a random Megumin image' },
        { name: 'senko', description: 'Fetch a random Senko image' },
        { name: 'shiro', description: 'Get a random Shiro image' },
        { name: 'holo', description: 'Fetch a random Holo image' }
    ],
    'INTERACTION GIFS': [
        { name: 'hug', description: 'Get a random hug GIF' },
        { name: 'kiss', description: 'Receive a random kiss GIF' },
        { name: 'pat', description: 'Receive a random pat GIF' },
        { name: 'cuddle', description: 'Receive a random cuddle GIF' },
        { name: 'slap', description: 'Enjoy a random slap GIF' },
        { name: 'bonk', description: 'Enjoy a random bonk GIF' },
        { name: 'poke', description: 'Get a random poke GIF' },
        { name: 'lick', description: 'Get a random lick GIF' },
        { name: 'bite', description: 'Receive a random bite GIF' },
        { name: 'highfive', description: 'Receive a random highfive GIF' },
        { name: 'handhold', description: 'Enjoy a random handhold GIF' },
        { name: 'tickle', description: 'Get a random tickle GIF' },
        { name: 'handshake', description: 'Receive a random handshake GIF' },
        { name: 'feed', description: 'Receive a random feed GIF' },
        { name: 'peck', description: 'Receive a random peck GIF' },
        { name: 'punch', description: 'Receive a random punch GIF' },
        { name: 'shoot', description: 'Receive a random shoot GIF' }
    ],
    'EMOTION GIFS': [
        { name: 'blush', description: 'Fetch a random blush GIF' },
        { name: 'smile', description: 'Receive a random smile GIF' },
        { name: 'happy', description: 'Get a random happy GIF' },
        { name: 'cry', description: 'Get a random cry GIF' },
        { name: 'pout', description: 'Enjoy a random pout GIF' },
        { name: 'cringe', description: 'Fetch a random cringe GIF' },
        { name: 'smug', description: 'Receive a random smug GIF' },
        { name: 'baka', description: 'Receive a random baka GIF' },
        { name: 'bored', description: 'Receive a random bored GIF' },
        { name: 'facepalm', description: 'Receive a random facepalm GIF' },
        { name: 'laugh', description: 'Receive a random laugh GIF' },
        { name: 'nope', description: 'Receive a random nope GIF' },
        { name: 'think', description: 'Receive a random think GIF' },
        { name: 'stare', description: 'Receive a random stare GIF' },
        { name: 'sleep', description: 'Receive a random sleep GIF' },
        { name: 'yawn', description: 'Receive a random yawn GIF' }
    ],
    'SPECIAL GIFS': [
        { name: 'dance', description: 'Enjoy a random dance GIF' },
        { name: 'wave', description: 'Enjoy a random wave GIF' },
        { name: 'wink', description: 'Get a random wink GIF' },
        { name: 'yeet', description: 'Receive a random yeet GIF' },
        { name: 'kick', description: 'Enjoy a random kick GIF' },
        { name: 'nom', description: 'Get a random nom GIF' },
        { name: 'awoo', description: 'Get a random awoo GIF' },
        { name: 'fluff', description: 'Get a random fluff GIF' },
        { name: 'tail', description: 'Enjoy a random tail GIF' },
        { name: 'glomp', description: 'Receive a random glomp GIF' },
        { name: 'comfy', description: 'Receive a random comfy GIF' },
        { name: 'eevee', description: 'Fetch a random Eevee GIF' },
        { name: 'bully', description: 'Get a random bully GIF' },
        { name: 'kill', description: 'Receive a random NSFW kill GIF' },
        { name: 'lurk', description: 'Receive a random lurk GIF' },
        { name: 'thumbsup', description: 'Receive a random thumbsup GIF' }
    ],
    'NSFW COMMANDS': [
        { name: 'anal', description: 'Get a random NSFW anal image or GIF' },
        { name: 'ass', description: 'Get a random NSFW ass image or GIF' },
        { name: 'blowjob', description: 'Receive a random NSFW blowjob image or GIF' },
        { name: 'breeding', description: 'Get a random NSFW breeding image or GIF' },
        { name: 'cages', description: 'Get a random NSFW cages image or GIF' },
        { name: 'ecchi', description: 'Get a random NSFW ecchi image or GIF' },
        { name: 'feet', description: 'Get a random NSFW feet image or GIF' },
        { name: 'fo', description: 'Get a random NSFW fo image or GIF' },
        { name: 'furry', description: 'Get a random NSFW furry image or GIF' },
        { name: 'gif', description: 'Get a random NSFW GIF' },
        { name: 'hentai', description: 'Get a random NSFW hentai image or GIF' },
        { name: 'legs', description: 'Get a random NSFW legs image or GIF' },
        { name: 'masturbation', description: 'Get a random NSFW masturbation image or GIF' },
        { name: 'milf', description: 'Get a random NSFW milf image or GIF' },
        { name: 'muscle', description: 'Get a random NSFW muscle image or GIF' },
        { name: 'neko', description: 'Get a random NSFW neko image or GIF' },
        { name: 'paizuri', description: 'Get a random NSFW paizuri image or GIF' },
        { name: 'petgirls', description: 'Get a random NSFW petgirls image or GIF' },
        { name: 'pierced', description: 'Get a random NSFW pierced image or GIF' },
        { name: 'selfie', description: 'Get a random NSFW selfie image or GIF' },
        { name: 'solo', description: 'Get a random NSFW solo GIF' },
        { name: 'smothering', description: 'Get a random NSFW smothering image or GIF' },
        { name: 'socks', description: 'Get a random NSFW socks image or GIF' },
        { name: 'trap', description: 'Retrieve a random NSFW trap image' },
        { name: 'vagina', description: 'Get a random NSFW vagina image or GIF' },
        { name: 'yuri', description: 'Get a random NSFW yuri image or GIF' },
        { name: 'cum', description: 'Fetch a random NSFW cum image or GIF' },
        { name: 'fuck', description: 'Get a random NSFW fuck image or GIF' },
        { name: 'pussylick', description: 'Get a random NSFW pussylick image or GIF' },
        { name: 'buttplug', description: 'Get a random NSFW buttplug image or GIF' },
        { name: 'oral', description: 'Get a random NSFW oral image or GIF' },
        { name: 'ero', description: 'Get a random NSFW ero image or GIF' }
    ]
};

// Utility function to safely handle callback queries
const safeAnswerCallback = async (ctx) => {
    if (ctx && typeof ctx.answerCallbackQuery === 'function') {
        try {
            await ctx.answerCallbackQuery();
        } catch (_) {
            // Silently ignore any errors
        }
    }
};

// Utility function to safely send/edit messages
const safeSendMessage = async (ctx, message, options) => {
    try {
        return await ctx.reply(message, options);
    } catch (_) {
        // Silently ignore any errors
        return null;
    }
};

const safeEditMessage = async (ctx, message, options) => {
    try {
        return await ctx.editMessageText(message, options);
    } catch (_) {
        // Silently ignore any errors
        return null;
    }
};

// Create navigation buttons
const createNavigationButtons = (currentCategory) => {
    try {
        const categoryNames = Object.keys(categories);
        const currentIndex = categoryNames.indexOf(currentCategory);
        
        const buttons = [];
        if (currentIndex > 0) buttons.push(Markup.button.callback('⬅️ Previous', `help:nav:${categoryNames[currentIndex - 1]}`));
        buttons.push(Markup.button.callback('🏠 Menu', 'help:menu'));
        if (currentIndex < categoryNames.length - 1) buttons.push(Markup.button.callback('Next ➡️', `help:nav:${categoryNames[currentIndex + 1]}`));
        
        return buttons;
    } catch (_) {
        // Return default button if there's any error
        return [Markup.button.callback('🏠 Menu', 'help:menu')];
    }
};

const createMainMenu = () => {
    try {
        let message = '✨ **WAIFUVERSE COMMAND GUIDE** ✨\n\nSelect a category:\n\n';
        Object.entries(categories).forEach(([category, emoji]) => message += `${emoji} **${category}**\n`);
        message += '\nNeed help? Join @WaifuVerse';
        
        const buttons = Object.entries(categories).map(([category, emoji]) => 
            [Markup.button.callback(`${emoji} ${category}`, `help:category:${category}`)]
        );
        return { message, buttons };
    } catch (_) {
        // Return a minimal fallback menu if there's any error
        return {
            message: '✨ **WAIFUVERSE COMMAND GUIDE** ✨\n\nPlease try again later.',
            buttons: [[Markup.button.callback('🔄 Refresh', 'help:menu')]]
        };
    }
};

const createCategoryPage = (category) => {
    try {
        const emoji = categories[category];
        let message = `${emoji} **${category}** ${emoji}\n\n`;
        
        commandsByCategory[category]?.forEach(cmd => 
            message += `• [/${cmd.name}](command:/${cmd.name}) - ${cmd.description}\n`
        );
        message += '\nNeed help? Join @WaifuVerse';
        
        const navigationButtons = createNavigationButtons(category);
        const keyboard = [navigationButtons];
        
        return { message, keyboard };
    } catch (_) {
        // Return a minimal fallback page if there's any error
        return {
            message: '⚠️ Category unavailable. Please return to menu.',
            keyboard: [[Markup.button.callback('🏠 Menu', 'help:menu')]]
        };
    }
};

module.exports = {
    name: 'help',
    description: 'Show detailed information about available commands',
    
    async execute(ctx) {
        const { message, buttons } = createMainMenu();
        await safeSendMessage(ctx, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            ...Markup.inlineKeyboard(buttons)
        });
    },
    
    actions: {
        'category': async (ctx) => {
            try {
                const category = ctx?.callbackQuery?.data?.split(':')?.[2];
                if (category) {
                    const { message, keyboard } = createCategoryPage(category);
                    await safeEditMessage(ctx, message, {
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true,
                        ...Markup.inlineKeyboard(keyboard)
                    });
                }
            } finally {
                await safeAnswerCallback(ctx);
            }
        },
        
        'nav': async (ctx) => {
            try {
                const category = ctx?.callbackQuery?.data?.split(':')?.[2];
                if (category) {
                    const { message, keyboard } = createCategoryPage(category);
                    await safeEditMessage(ctx, message, {
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true,
                        ...Markup.inlineKeyboard(keyboard)
                    });
                }
            } finally {
                await safeAnswerCallback(ctx);
            }
        },
        
        'menu': async (ctx) => {
            try {
                const { message, buttons } = createMainMenu();
                await safeEditMessage(ctx, message, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    ...Markup.inlineKeyboard(buttons)
                });
            } finally {
                await safeAnswerCallback(ctx);
            }
        }
    }
};