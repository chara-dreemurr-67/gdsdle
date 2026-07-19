import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, User } from "discord.js";
import type { Command } from "../types/Command.js";
import DataManager from "../singletons/DataManager.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a user.")
        .addUserOption(Option => 
            Option
                .setName("who")
                .setDescription("User to ban.")
                .setRequired(true)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("who", true);
        const Ban = DataManager.Unban(User.id);
        if(!Ban.Status) {
            await Interaction.reply({
                content: "This user wasn't banned.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await Interaction.reply({
            content: `${User.username} has been unbanned successfully.`,
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    },
    Administrator: true
} satisfies Command;