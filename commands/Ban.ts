import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, User } from "discord.js";
import type { Command } from "../types/Command.js";
import DataManager from "../singletons/DataManager.js";
import LoadEnv from "../singletons/LoadEnv.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user.")
        .addUserOption(Option => 
            Option
                .setName("who")
                .setDescription("User to ban.")
                .setRequired(true)
        )
        .addStringOption(Option => 
            Option
                .setName("reason")
                .setDescription("Ban reason.")
                .setRequired(false)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("who", true);

        if(LoadEnv.ADMINISTRATOR_IDS.includes(User.id)) {
            await Interaction.reply({
                content: "You cannot ban this user.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const Reason: string = Interaction.options.getString("reason", false) ?? "No reason given.";
        const Ban = DataManager.Ban(User.id, Interaction.user.id, Reason);
        if(!Ban.Status) {
            await Interaction.reply({
                content: "This user has already been banned.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await Interaction.reply({
            content: `${User.username} has been banned successfully. Reason: ${Reason}`,
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    },
    Administrator: true
} satisfies Command;