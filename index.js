const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const colors = require('picocolors');

// Bot token from environment variable
const TELEGRAM_BOT_TOKEN = process.env['TELEGRAM_BOT_TOKEN'];

// Enhanced console logging utility with timestamps
const logger = {
    timestamp: () => colors.gray(`[${new Date().toISOString()}]`),
    info: (msg) => console.log(`${logger.timestamp()} ${colors.blue('ℹ')} ${colors.cyan(msg)}`),
    success: (msg) => console.log(`${logger.timestamp()} ${colors.green('✔')} ${colors.green(msg)}`),
    warn: (msg) => console.log(`${logger.timestamp()} ${colors.yellow('⚠')} ${colors.yellow(msg)}`),
    error: (msg, err) => console.error(
        `${logger.timestamp()} ${colors.red('✖')} ${colors.red(msg)}` + 
        (err ? `\n${colors.gray(err.stack || err)}` : '')
    ),
    command: (cmd, desc) => console.log(
        `${logger.timestamp()} ${colors.magenta('➜')} ${colors.bold(`/${cmd}`)}` +
        colors.gray(` - ${desc}`)
    ),
    debug: (msg) => process.env.DEBUG && console.log(
        `${logger.timestamp()} ${colors.gray('🔍')} ${colors.gray(msg)}`
    )
};

// Token validation
if (!TELEGRAM_BOT_TOKEN) {
    logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    process.exit(1);
}

// Initialize bot with enhanced configuration and error handling
const bot = new Telegraf(TELEGRAM_BOT_TOKEN, {
    handlerTimeout: 90000,
    telegram: {
        webhookReply: false,
        apiRoot: process.env.TELEGRAM_API_ROOT || 'https://api.telegram.org'
    }
});

// Enhanced collections with validation and error tracking
const commands = new Map();
const actions = new Map();
const errorCounts = new Map(); // Track command errors

// Enhanced command loading with validation and error handling
const loadCommands = () => {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        logger.info('Created commands directory structure');
    }

    const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    logger.info(`Found ${colors.bold(commandFiles.length)} command files`);

    let loadedCount = 0;
    let errorCount = 0;

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);
            
            // Enhanced validation with detailed checking
            const requiredProps = ['name', 'description', 'execute'];
            const missingProps = requiredProps.filter(prop => !command[prop]);
            
            if (missingProps.length === 0) {
                if (commands.has(command.name)) {
                    logger.warn(`Duplicate command name found: ${command.name} in ${file}`);
                    continue;
                }

                commands.set(command.name, {
                    ...command,
                    filename: file,
                    loadedAt: new Date(),
                    errorCount: 0
                });
                
                if (command.actions) {
                    Object.entries(command.actions).forEach(([actionName, handler]) => {
                        const fullActionName = `${command.name}:${actionName}`;
                        if (actions.has(fullActionName)) {
                            logger.warn(`Duplicate action name found: ${fullActionName}`);
                            return;
                        }
                        actions.set(fullActionName, handler);
                        logger.debug(`Registered action: ${colors.bold(fullActionName)}`);
                    });
                }
                
                loadedCount++;
                logger.success(`Loaded command: ${colors.bold(command.name)}`);
            } else {
                errorCount++;
                logger.warn(`Invalid command in ${file}. Missing: ${missingProps.join(', ')}`);
            }
        } catch (error) {
            errorCount++;
            logger.error(`Failed to load ${file}`, error);
        }
    }

    logger.info(`Command loading complete: ${loadedCount} loaded, ${errorCount} errors`);
};

// Enhanced reload function with safety checks and backup
const reloadCommands = () => {
    const backup = {
        commands: new Map(commands),
        actions: new Map(actions)
    };
    
    try {
        commands.clear();
        actions.clear();
        loadCommands();
        
        logger.success(
            `Reloaded ${colors.bold(commands.size)} commands and ` +
            `${colors.bold(actions.size)} actions`
        );
    } catch (error) {
        logger.error('Critical error during reload, restoring backup', error);
        commands.clear();
        actions.clear();
        backup.commands.forEach((cmd, name) => commands.set(name, cmd));
        backup.actions.forEach((action, name) => actions.set(name, action));
    }
};

// Initial command load
loadCommands();

// Enhanced keyboard creation with validation and error handling
const createKeyboard = (buttons, options = {}) => {
    if (!Array.isArray(buttons)) {
        throw new TypeError('Buttons must be an array');
    }

    if (buttons.length === 0) {
        throw new Error('Buttons array cannot be empty');
    }

    const { columns = 2, oneTime = false, resize = true } = options;
    
    if (columns < 1) {
        throw new Error('Columns must be at least 1');
    }
    
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += columns) {
        keyboard.push(buttons.slice(i, i + columns));
    }
    
    return Markup.keyboard(keyboard)
        .oneTime(oneTime)
        .resize(resize);
};

// Enhanced inline keyboard creation with validation
const createInlineKeyboard = (buttons, options = {}) => {
    if (!Array.isArray(buttons)) {
        throw new TypeError('Buttons must be an array');
    }

    if (buttons.length === 0) {
        throw new Error('Buttons array cannot be empty');
    }

    const { columns = 2 } = options;
    
    if (columns < 1) {
        throw new Error('Columns must be at least 1');
    }
    
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += columns) {
        keyboard.push(buttons.slice(i, i + columns));
    }
    
    return Markup.inlineKeyboard(keyboard);
};

// Enhanced command handlers with error tracking and rate limiting
commands.forEach((command, name) => {
    bot.command(name, async (ctx) => {
        const startTime = Date.now();
        try {
            await command.execute(ctx, { createKeyboard, createInlineKeyboard });
            logger.debug(
                `Command ${colors.bold(name)} executed in ${Date.now() - startTime}ms`
            );
        } catch (error) {
            command.errorCount = (command.errorCount || 0) + 1;
            logger.error(`Command execution failed: ${name}`, error);
            await ctx.reply('⚠️ An error occurred while processing your command.');
            
            if (command.errorCount >= 5) {
                logger.warn(
                    `Command ${name} has failed ${command.errorCount} times, consider checking for issues`
                );
            }
        }
    });
});

// Enhanced callback query handling with timeouts and error tracking
bot.on('callback_query', async (ctx) => {
    const startTime = Date.now();
    try {
        const [command, action] = ctx.callbackQuery.data.split(':');
        const handler = actions.get(`${command}:${action}`);
        
        if (handler) {
            await handler(ctx, { createKeyboard, createInlineKeyboard });
            logger.debug(
                `Callback ${colors.bold(`${command}:${action}`)} processed in ${Date.now() - startTime}ms`
            );
        } else {
            logger.warn(`Unknown action: ${colors.bold(ctx.callbackQuery.data)}`);
            await ctx.answerCallbackQuery('⚠️ This action is not available.');
        }
    } catch (error) {
        logger.error('Callback processing failed', error);
        await ctx.answerCallbackQuery('❌ Error processing your request.');
    }
});

// Enhanced bot launch with health checks
bot.launch()
    .then(() => {
        logger.success(colors.bold('Bot successfully started! 🚀'));
        logger.info(colors.bold('\nAvailable Commands:'));
        commands.forEach((command, name) => {
            logger.command(name, command.description);
        });
    })
    .catch(err => {
        logger.error('Bot failed to start', err);
        process.exit(1);
    });

// Enhanced graceful shutdown with cleanup
const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
        await bot.stop(signal);
        logger.success('Bot stopped successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
    }
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown('UNCAUGHT_EXCEPTION').catch(() => process.exit(1));
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});