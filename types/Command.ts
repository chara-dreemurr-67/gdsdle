import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
    Command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    Action: (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal) => Promise<void>;
    Autocomplete?: (Interaction: AutocompleteInteraction) => Promise<void>;
    Button?: (Interaction: ButtonInteraction) => Promise<void>;
    Cancelable?: {
        Pool: Map<string, AbortController>;
        Message?: string;
    };
    Administrator?: boolean;
    AllowBanned?: boolean;
}