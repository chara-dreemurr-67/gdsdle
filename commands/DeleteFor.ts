import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, User } from "discord.js";
import type { Command } from "../types/Command.js";
import DataManager from "../singletons/DataManager.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("deletefor")
        .setDescription(`Delete someone's GDSdle profile.`)
        .addUserOption(Option => 
            Option
                .setName("who")
                .setDescription("User to delete profile.")
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const User: User = Interaction.options.getUser("who", true);
        const UserID: string = User.id;
        if(!DataManager.HasProfile(UserID)) {
            await Interaction.reply({
                content: `${User.username} don't have a GDSdle profile.`,
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setTitle("Delete Profile")
            .setDescription(`Are you sure you want to delete ${User.username}'s GDSdle profile?`)
            .setColor(0xff0000)
        ;
        const Row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`DeleteFor:Confirm`)
                .setLabel("Delete Profile")
                .setStyle(ButtonStyle.Danger)
            ,
            new ButtonBuilder()
                .setCustomId(`DeleteFor:Cancel`)
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
        switch(Interaction.customId) {
            case `DeleteFor:Confirm`:
                await Interaction.update({
                    content: "Profile has been deleted successfully."
                });

                break;
            
            case `DeleteFor:Cancel`:
                await Interaction.update({
                    content: "Profile deletion cancelled."
                });
                break;
        }
    },
    Administrator: true
} satisfies Command;