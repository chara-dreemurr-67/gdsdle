import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { FailedReasons } from "../singletons/TodaysGDSdle.js";
import GameManager from "../singletons/GameManager.js";
import TodaysGDSdle from "../singletons/TodaysGDSdle.js";
import LoadEnv from "../singletons/LoadEnv.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a new game of GDSdle.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;

        if(GameManager.Has(UserID)) {
            if(GameManager.Get(UserID)!.Progress.length === LoadEnv.MAX_TRIES) {
                await Interaction.reply({
                    content: "You have finished today's game of GDSdle! Use /getresult to see today's GDSdle result.",
                    allowedMentions: { repliedUser: false },
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            await Interaction.reply({
                content: "There's already a game going on.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        GameManager.New(UserID);
        await Interaction.deferReply();
        const Status = await TodaysGDSdle.TodaysWordList;

        if(!Status.Status) {
            let ErrorMessage!: string;
            switch(Status.Reason) {
                case FailedReasons.GuildNotFound:
                    ErrorMessage = `Server ${LoadEnv.SERVER_ID} doesn't exist or doesn't use MEE6 leveling.`;
                    break;
                case FailedReasons.NoPlayerAboveLevel50:
                    ErrorMessage = `Server ${LoadEnv.SERVER_ID} doesn't have any member level 50 or above.`;
                    break;
                case FailedReasons.APIError:
                    ErrorMessage = `API Error.`;
                    break;
            }
            await Interaction.editReply({
                content: ErrorMessage,
                allowedMentions: { repliedUser: false }
            });
            return;
        }

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