import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import DataManager from "../singletons/DataManager.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Create a new GDSdle profile. Can be remove with /delete.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const UserID: string = Interaction.user.id;
        if(DataManager.HasProfile(UserID)) {
            await Interaction.reply({
                content: "You already have a GDSdle profile.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const Timeout = DataManager.GetTimeout(UserID);
        const Now: number = Date.now();
        if(Timeout.Status && Now < Timeout.Timeout) {
            await Interaction.reply({
                content: `You're in timeout, you can create a profile again <t:${Math.floor(Timeout.Timeout / 1000)}:R>.`,
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        DataManager.CreateProfile(UserID);
        await Interaction.reply({
            content: "Profile created successfully.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    }
} satisfies Command;