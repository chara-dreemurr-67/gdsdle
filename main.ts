import { Client as C, GatewayIntentBits, Events, MessageFlags } from "discord.js";
import type { Command } from "./types/Command.js";
import CommandManager from "./singletons/CommandManager.js";
import DataManager  from "./singletons/DataManager.js";
import LoadEnv from "./singletons/LoadEnv.js";
import Database from "./Database.js";

await CommandManager.LoadCommands();

const Client: C = new C({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
    ]
});

const Signals: string[] = [
    "SIGTERM",
    "SIGINT",
    "uncaughtException",
    "unhandledRejection"
];

for(const Signal of Signals) {
    process.on(Signal, async () => {
        Database.close();
        await Client.destroy();
    });
}

Client.once(Events.ClientReady, Client => console.log(`Logged in as ${Client.user.tag}`));
Client.on(Events.InteractionCreate, async Interaction => {
    if(Interaction.isAutocomplete()) {
        const Command: Command | undefined = CommandManager.Get(Interaction.commandName);
        if(Command && Command.Autocomplete) {
            if(Command.Administrator && !LoadEnv.ADMINISTRATOR_IDS.includes(Interaction.user.id)) 
                return;
            
            if(!Command.AllowBanned && DataManager.IsBanned(Interaction.user.id)) 
                return;
            await Command.Autocomplete(Interaction);
        }
        return;
    }

    if(Interaction.isButton()) {
        const [CommandName] = Interaction.customId.split(":");
        const Command = CommandManager.Get(CommandName);
        if(!Command?.Button) 
            return;

        await Command.Button(Interaction);
        return;
    }

    if(!Interaction.isChatInputCommand()) 
        return;

    const Command: Command | undefined = CommandManager.Get(Interaction.commandName);
    if(!Command)
        return;
    
    let Arg2: AbortController | undefined = undefined;
    if(Command.Cancelable) {
        const Existing: AbortController | undefined = Command.Cancelable.Pool.get(Interaction.user.id);
        if(Existing) {
            await Interaction.reply({
                content: Command.Cancelable.Message ?? "This command is still running.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        const Controller: AbortController = new AbortController();
        Arg2 = Controller;
        Command.Cancelable.Pool.set(Interaction.user.id, Controller);
    }

    try {
        console.log(`${Interaction.user.id}(${Interaction.user.username}) used ${Interaction.commandName}.`);
        if(Command.Administrator && !LoadEnv.ADMINISTRATOR_IDS.includes(Interaction.user.id)) {
            await Interaction.reply({
                content: "You are not permitted to use this command.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if(!Command.AllowBanned && DataManager.IsBanned(Interaction.user.id)) {
            await Interaction.reply({
                content: "You are not allowed to use this command.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await Command.Action(Interaction, Arg2?.signal);
    }
    catch(Err) {
        console.error(Err);

        if(Interaction.replied || Interaction.deferred) {
            await Interaction.followUp({
                content: "Something went wrong.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await Interaction.reply({
            content: "Something went wrong.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    }
    finally {
        if(Command.Cancelable) {
            Command.Cancelable.Pool.delete(Interaction.user.id);
        }
    }
});
Client.login(LoadEnv.DISCORD_TOKEN);