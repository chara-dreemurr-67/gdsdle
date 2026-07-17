import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import TodaysGDSdle from "../singletons/TodaysGDSdle.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("getmeta")
        .setDescription("Get's today GDSdle information.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const Status = await TodaysGDSdle.TodaysWordList;
        if(!Status.Status) {
            await Interaction.reply({
                content: "Something went wrong.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await Interaction.deferReply();

        const TodaysMeta = Status.Meta;
        const Today: string = await TodaysGDSdle.TodaysGDSdle;
        const Profile = TodaysMeta[Today];
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(Profile.Role?.role.color ?? 0xffffff)
            .setTitle(`Today's GDSdle.`)
            .addFields(
                {
                    name: "Username Length",
                    value: `${Today.length} characters`,
                    inline: true
                },
                {
                    name: "Level Role",
                    value: Profile.Role?.role.name ?? "No role",
                    inline: true
                },
                {
                    name: "Leaderboard Range",
                    value: `#${Profile.PlacementRage[0]}-#${Profile.PlacementRage[1]}`,
                    inline: true
                }
            )
        ;
        await Interaction.editReply({
            embeds: [Embed],
            allowedMentions: { repliedUser: false }
        });
    }
} satisfies Command;