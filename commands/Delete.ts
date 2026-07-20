import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import LoadEnv from "../singletons/LoadEnv.js";
import DataManager from "../singletons/DataManager.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("delete")
        .setDescription(`Delete your GDSdle profile. Note: this will put you in a ${LoadEnv.TIMEOUT_DURATION / 86400} days timeout.`)
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        if(!DataManager.HasProfile(UserID)) {
            await Interaction.reply({
                content: "You don't have a GDSdle profile.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setTitle("Delete Profile")
            .setDescription(
                "Are you sure you want to delete your GDSdle profile?\n\n" +
                `This action cannot be undone and will place you in a ${LoadEnv.TIMEOUT_DURATION / 86400} days timeout.`
            )
            .setColor(0xff0000)
        ;
        const Row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`delete:Confirm:${UserID}`)
                .setLabel("Delete Profile")
                .setStyle(ButtonStyle.Danger)
            ,
            new ButtonBuilder()
                .setCustomId(`delete:Cancel:${UserID}`)
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary)
            ,
        );
        await Interaction.reply({
            embeds: [Embed],
            components: [Row],
            flags: MessageFlags.Ephemeral
        });
    },
    Button: async (Interaction: ButtonInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        switch(Interaction.customId) {
            case `delete:Confirm:${UserID}`:
                await Interaction.update({
                    content: "Your profile has been deleted.",
                    embeds: [],
                    components: []
                });
                DataManager.RemoveProfile(UserID);
                break;
            
            case `Delete:Cancel:${UserID}`:
                await Interaction.update({
                    content: "Profile deletion cancelled.",
                    embeds: [],
                    components: []
                });
                break;
        }
    },
    AllowBanned: true
} satisfies Command;