import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, User } from "discord.js";
import type { Command } from "../types/Command.js";
import GameManager, { Tiles } from "../singletons/GameManager.js";
import TodaysGDSdle from "../singletons/TodaysGDSdle.js";
import LoadEnv from "../singletons/LoadEnv.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("guess")
        .setDescription("Make a guess. Needs to /play to start a game first.")
        .addStringOption(Option => 
            Option
                .setName("user")
                .setDescription("User you want to guess. Case insensitive.")
                .setRequired(true)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        const Guess: string = Interaction.options.getString("user", true).toLowerCase().trim();
        const Today: string = await TodaysGDSdle.TodaysGDSdle;

        if(Guess.length !== Today.length) {
            await Interaction.reply({
                content: "Answer's length must match GDSdle's length.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        if(/[^A-Za-z0-9_.]/.test(Guess)) {
            await Interaction.reply({
                content: "Invalid username. (Usernames can only contains alphanumeric characters, underscores _, and periods .)",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if(!GameManager.Has(UserID)) {
            await Interaction.reply({
                content: "Start a game with /play first!",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        const Player = GameManager.Get(UserID)!;

        if(Player.Progress.length === LoadEnv.MAX_TRIES) {
            await Interaction.reply({
                content: "You have finished today's game of GDSdle!",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const Result = GameManager.Guess(UserID, Guess, Today);
        if(Result.Correct || Result.Progress.length === LoadEnv.MAX_TRIES) {
            if(Result.Correct) {
                Player.Correct = true;
    
                const Filler: Tiles[][] = [];
                for(let i = 0; i < LoadEnv.MAX_TRIES - Player.Progress.length; i++) 
                    Filler.push(new Array<Tiles>(Today.length).fill(Tiles.White))
                Player.Progress.push(...Filler);
            }

            await Interaction.reply({
                content: `Result: ${Result.Progress.join("")}`,
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });

            const User: User = Interaction.user;
            const Embed: EmbedBuilder = new EmbedBuilder()
                .setColor(Result.Correct ? 0x00ff00 : 0xff0000)
                .setAuthor({
                    name: User.username,
                    url: `https://discord.com/users/${User.id}`,
                    iconURL: User.displayAvatarURL({ size: 256 })
                })
                .setThumbnail(User.displayAvatarURL({ size: 512 }))
                .setTitle("Today's GDSdle Result")
                .setDescription(`Tries: ${Player.Tries}`)
                .addFields(
                    {
                        name: "Result",
                        value: Player.Progress.map(Row => Row.join("")).join("\n")
                    }
                )
            ;

            await Interaction.followUp({
                embeds: [Embed]
            });
        }
    }
} satisfies Command;