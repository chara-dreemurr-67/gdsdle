import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, type User } from "discord.js";
import type { Command } from "../types/Command.js";
import GameManager, { Tiles } from "../singletons/GameManager.js";
import LoadEnv from "../singletons/LoadEnv.js";
import TodaysGDSdle from "../singletons/TodaysGDSdle.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("getresult")
        .setDescription("Get the result of today's GDSdle.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const UserID: string = Interaction.user.id;
        const Today: string = await TodaysGDSdle.TodaysGDSdle;

        let Correct: boolean = false;
        let Finished: boolean = false;
        let Progress: Tiles[][] = [];
        let Tries: number = 0;
        if(!GameManager.Has(UserID)) {            
            while(Progress.length < LoadEnv.MAX_TRIES) {
                Progress.push(new Array<Tiles>(Today.length).fill(Tiles.White));
            }
        }
        else {
            const Player = GameManager.Get(UserID)!;
            Tries = Player.Tries;
            Progress = structuredClone(Player.Progress);
            Correct = Player.Correct;
            Finished = Player.Correct || Progress.length === LoadEnv.MAX_TRIES;

            while(Progress.length < LoadEnv.MAX_TRIES - Player.Progress.length) {
                Progress.push(new Array<Tiles>(Today.length).fill(Tiles.White));
            }
        }

        const User: User = Interaction.user;
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(Finished ? 0x222222 : Correct ? 0x00ff00 : 0xff0000)
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Today's GDSdle Result${!Finished ? " (Unfinished)" : ""}`)
            .setDescription(`Tries: ${Tries}`)
            .addFields(
                {
                    name: "Result",
                    value: Progress.map(Row => Row.join("")).join("\n")
                }
            )
        ;

        await Interaction.reply({
            embeds: [Embed],
            allowedMentions: { repliedUser: false }
        });
        
    }
} satisfies Command;