import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("source")
        .setDescription("Prints the link to the GitHub repository of this bot.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        await Interaction.reply({ 
            content: "https://github.com/chara-dreemurr-67/gdsdle",
            allowedMentions: { repliedUser: false }, 
            flags: MessageFlags.Ephemeral 
        });
    }
} satisfies Command;