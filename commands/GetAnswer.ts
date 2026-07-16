import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import TodaysGDSdle from "../singletons/TodaysGDSdle.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("getanswer")
        .setDescription("Get the answer for today's GDSdle.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        Interaction.reply({
            content: `Today's GDSdle answer is: ${await TodaysGDSdle.TodaysGDSdle}`,
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    },
    Administrator: true
} satisfies Command;