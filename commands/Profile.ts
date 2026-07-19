import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, User } from "discord.js";
import type { Command } from "../types/Command.js";
import DataManager from "../singletons/DataManager.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if the bot is alive or not.")
        .addUserOption(Option =>
            Option
                .setName("who")
                .setDescription("User to get profile of.")
                .setRequired(false)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("who", false) ?? Interaction.user;
        const Profile = DataManager.GetProfile(User.id);
        if(!Profile.Status) {
            await Interaction.reply({
                content: `User ${User.username} doesn't have a GDSdle profile.`,
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(0xffffff)
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`${User.username}'s lifetime statistic`)
            .addFields(
                ...Object.entries(Profile.Profile).map(([Key, Value]) => ({
                    name: Key,
                    value: Value,
                    inline: true
                }))
            )
        ;

        await Interaction.reply({
            embeds: [Embed],
            allowedMentions: { repliedUser: false }
        });
    }
} satisfies Command;