import dotenv from "dotenv";

dotenv.config();

export default {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "",
    SERVER_ID: process.env.SERVER_ID ?? "",
    CLIENT_ID: process.env.CLIENT_ID ?? "",
    ADMINISTRATOR_IDS: ((): string[] => {
        try {
            return (process.env.ADMINISTRATOR_IDS ? JSON.parse(process.env.ADMINISTRATOR_IDS) : []) as string[];
        }
        catch {
            return [];
        }
    })(),
    MAX_TRIES: /^\+?\d+$/.test(process.env.MAX_TRIES ?? "") ? Number(process.env.MAX_TRIES) : 6,
    MINIMUM_LEVEL_REQUIREMENT: /^\+?\d+$/.test(process.env.MINIMUM_LEVEL_REQUIREMENT ?? "") ? Number(process.env.MAX_TRIES) : 50,
    TIMEOUT_DURATION: /^\+?\d+$/.test(process.env.TIMEOUT_DURATION ?? "") ? Number(process.env.TIMEOUT_DURATION) : 604800000
};