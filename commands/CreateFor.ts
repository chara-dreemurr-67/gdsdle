import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, User } from "discord.js";
import type { Command } from "../types/Command.js";
import DataManager from "../singletons/DataManager.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("createfor")
        .setDescription("Create a new GDSdle profile for someone else, this bypass timeout.")
        .addUserOption(Option => 
            Option
                .setName("who")
                .setDescription("User to create profile for.")
                .setRequired(true)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("who", true);
        const UserID: string = User.id;
        if(DataManager.HasProfile(UserID)) {
            await Interaction.reply({
                content: `${User.username} already has a GDSdle profile.`,
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        DataManager.CreateProfile(UserID);
        await Interaction.reply({
            content: `Profile created successfully for ${User.username}.`,
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    },
    Administrator: true
} satisfies Command;