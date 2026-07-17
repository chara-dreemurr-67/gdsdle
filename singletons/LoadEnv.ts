import dotenv from "dotenv";

dotenv.config();

export default {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "",
    SERVER_ID: process.env.SERVER_ID ?? "",
    CLIENT_ID: process.env.CLIENT_ID ?? "",
    ADMINISTRATOR_ID: process.env.ADMINISTRATOR_ID ?? "",
    MAX_TRIES: /^\+?\d+$/.test(process.env.MAX_TRIES ?? "") ? Number(process.env.MAX_TRIES) : 5,
    MINIMUM_LEVEL_REQUIREMENT: /^\+?\d+$/.test(process.env.MINIMUM_LEVEL_REQUIREMENT ?? "") ? Number(process.env.MAX_TRIES) : 50
};