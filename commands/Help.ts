import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, type APIApplicationCommandOption, type ToAPIApplicationCommandOptions } from "discord.js";
import type { Command } from "../types/Command.js";
import CommandManager from "../singletons/CommandManager.js";
import LoadEnv from "../singletons/LoadEnv.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get a list of commands.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        await Interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(0x00ffff)
            .setTitle(`GDSdle. Can you guess that level ${LoadEnv.MINIMUM_LEVEL_REQUIREMENT}+ GDS member?`)
            .addFields(
                ...[...CommandManager.Values()].map(Command => {
                    const Options: ToAPIApplicationCommandOptions[] = Command.Command.options;
                    return {
                        name: `/${Command.Command.name} ${
                            Options.map(Option => {
                                const JSON: APIApplicationCommandOption = Option.toJSON()
                                return `[${JSON.name}${JSON.required ? "*" : ""}]`
                            }).join(" ")
                        }`.trim(),
                        value: `${Command.Command.description}`,
                        inline: true 
                    }
                })
            )
            .setFooter({ 
                text: "* = required options, (Administrator Command) = commands only the bot host can run, (Cancelable) = long running commands that can be cancel with /cancel."
             })
        ;
        await Interaction.editReply({
            embeds: [Embed],
            allowedMentions: { repliedUser: false }
        })
    }
} satisfies Command;