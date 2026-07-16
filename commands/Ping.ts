import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if the bot is alive or not.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        await Interaction.reply({ 
            content: "It is alive!", 
            allowedMentions: { repliedUser: false }, 
            flags: MessageFlags.Ephemeral 
        });
    }
} satisfies Command;