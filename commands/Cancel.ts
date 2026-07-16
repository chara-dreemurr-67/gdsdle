import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import CommandManager from "../singletons/CommandManager.js";

const SendMessage = async (Interaction: ChatInputCommandInteraction, Message: string): Promise<void> => {
    await Interaction.reply({
        content: Message,
        allowedMentions: { repliedUser: false },
        flags: MessageFlags.Ephemeral
    });
};

export default {
    Command: new SlashCommandBuilder()
        .setName("cancel")
        .setDescription("Cancel a running command in case you got fed up with it taking too long to finish.")
        .addStringOption(Option => 
            Option
                .setName("command")
                .setDescription("Command to cancel. Only running, cancelable commands can be canceled.")
                .setAutocomplete(true)
                .setRequired(true)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const Target: string = Interaction.options.getString("command", true);
        const Command: Command | undefined = CommandManager.Get(Target);

        if(!Command) {
            await SendMessage(Interaction, `Command "${Interaction.commandName}" doesn't exist.`);
            return;
        }

        if(!Command.Cancelable) {
            await SendMessage(Interaction, `Command "${Interaction.commandName}" is not cancelable.`);
            return;
        }

        const Controller: AbortController | undefined = Command.Cancelable.Pool.get(Interaction.user.id);

        if(!Controller) {
            await SendMessage(Interaction, `Command "${Interaction.commandName}" is currently not running.`);
            return;
        }

        Controller.abort();
        await SendMessage(Interaction, `Cancelled "${Target}".`);
    },
    Autocomplete: async (Interaction: AutocompleteInteraction): Promise<void> => {
        await Interaction.respond(
            [...CommandManager.Values()].filter(
                Command => Command.Cancelable && Command.Cancelable.Pool.has(Interaction.user.id)
            ).map(Command => ({
                name: Command.Command.name,
                value: Command.Command.name
            }))
        );
    }
} satisfies Command;