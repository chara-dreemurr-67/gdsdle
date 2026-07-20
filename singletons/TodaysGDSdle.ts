import type { MeeseeksLeaderboard, RoleRewards } from "../types/MeeseeksLeaderboard.js";
import { EventEmitter } from "events";
import FetchMeeseeksAPI from "../helpers/FetchMeeseeksAPI.js";
import timers from "timers/promises";
import crypto from "crypto";
import LoadEnv from "./LoadEnv.js";
import Database from "../Database.js";

export enum FailedReasons {
    GuildNotFound,
    NoPlayerAboveLevel50,
    APIError
}

interface WordList {
    Timestamp: number;
    WordList: string[];
}

interface Meta {
    // Start -> end. e.g. 601 -> 500
    PlacementRange: [number, number];
    Role?: RoleRewards;
}

interface Succeeded {
    Status: true;
    WordList: WordList;
    Meta: UserMeta;
}

interface Failed {
    Status: false;
    Reason: FailedReasons;
}

interface CacheWordListRow {
    ID: number;
    Timestamp: number;
    Wordlist: string;
}

interface CacheMetaRow {
    Username: string;
    PlacementRange: string;
    Role?: string;
}

type Output = 
    | Failed
    | Succeeded
;

type UserMeta = Record<string, Meta>;

class TodaysGDSdle extends EventEmitter {
    private CachedUsersMeta: UserMeta | undefined;
    private CachedWordList: WordList | undefined;
    private CachedGDSdle: string | undefined;

    private readonly CacheWordListSTMT = Database.prepare(`
        INSERT INTO CachedWordList
        (ID, Timestamp, WordList)
        VALUES(1, ?, ?)
        ON CONFLICT(ID) DO UPDATE SET
            Timestamp = excluded.Timestamp,
            WordList = excluded.WordList
    `);
    private readonly CacheMetaSTMT = Database.prepare(`
        INSERT INTO CachedMeta
        (Username, PlacementRange, Role)
        VALUES(?, ?, ?)
        ON CONFLICT(Username) DO UPDATE SET
            PlacementRange = excluded.PlacementRange,
            Role = excluded.Role
    `); 

    public IsTodayUTC(Timestamp: number): boolean {
        const TS: Date = new Date(Timestamp);
        const Now: Date = new Date();
        return (
            TS.getUTCDate() == Now.getUTCDate() &&
            TS.getUTCMonth() == Now.getUTCMonth() &&
            TS.getUTCFullYear() == Now.getUTCFullYear()
        );
    };

    private Shuffle<T>(Arr: T[]): T[] {
        for(let i: number = Arr.length - 1; i > 0; i--) {
            const j: number = crypto.randomInt(i + 1);
            [Arr[i], Arr[j]] = [Arr[j], Arr[i]];
        }
        return Arr;
    }

    private async GetTodaysWordList(): Promise<Output> {
        if(this.CachedWordList && this.CachedUsersMeta && this.IsTodayUTC(this.CachedWordList.Timestamp)) {
            return {
                Status: true,
                WordList: this.CachedWordList,
                Meta: this.CachedUsersMeta 
            };
        }

        const CachedRow = Database.prepare("SELECT * FROM CachedWordList WHERE ID = 1").get() as CacheWordListRow | undefined;
        const MetaRows = Database.prepare("SELECT * FROM CachedMeta").all() as CacheMetaRow[];

        if(CachedRow?.Wordlist && MetaRows.length) {
            const WordList: WordList = {
                Timestamp: CachedRow.Timestamp,
                WordList: JSON.parse(CachedRow.Wordlist)
            };

            const Meta: UserMeta = Object.fromEntries(
                MetaRows.map(Row => [
                    Row.Username, { 
                        PlacementRange: JSON.parse(Row.PlacementRange), 
                        Role: Row.Role ? JSON.parse(Row.Role) : Row.Role 
                    }
                ])
            );
            if(!this.IsTodayUTC(WordList.Timestamp)) {
                this.emit("newDay");
                this.CachedWordList = undefined;
                this.CachedUsersMeta = undefined;
            }
            else {
                this.CachedWordList = WordList;
                this.CachedUsersMeta = Meta;
                return {
                    Status: true,
                    WordList,
                    Meta
                };
            }
        }

        let Finished: boolean = false;
        let WordList: Set<string> = new Set<string>();
        let Meta: UserMeta = {};

        for(let i = 0; i < 1000; i++) {
            let Res: Response;
            try {
                Res = await FetchMeeseeksAPI(LoadEnv.SERVER_ID, i);
            }
            catch {
                return {
                    Status: false,
                    Reason: FailedReasons.APIError
                };
            }

            if(Res.status === 404) {
                return {
                    Status: false,
                    Reason: FailedReasons.GuildNotFound
                };
            }

            if(!Res.ok) {
                return {
                    Status: false,
                    Reason: FailedReasons.APIError
                };
            }

            const Leaderboard: MeeseeksLeaderboard = await Res.json() as MeeseeksLeaderboard;

            if(Leaderboard.players.length === 0) 
                break;

            // Neglegible
            WordList = new Set([
                ...WordList, 
                ...Leaderboard.players
                    .filter(
                        Player => {
                            if(Player.level < LoadEnv.MINIMUM_LEVEL_REQUIREMENT)
                                Finished = true;
                            return Player.level >= 50 && !/[^A-Za-z0-9_.]/.test(Player.username);
                        }
                    )
                    .map((Player, Index) => {
                        Meta[Player.username] = {
                            PlacementRange: ((): [number, number] => {
                                const Level: number = Index + i * 1000 + 1;
                                const Start: number = Math.floor((Level - 1) / 100) * 100 + 1;
                                const End: number = Start + 99;
                                return [Start, End];
                            })(),
                            Role: ((): RoleRewards | undefined => {
                                const Index: number = Leaderboard.role_rewards.findIndex(Role => Role.rank > Player.level);
                                return Leaderboard.role_rewards.length 
                                    ? Leaderboard.role_rewards[Index !== -1 ? Index - 1 : Leaderboard.role_rewards.length - 1]
                                    : undefined
                                ;
                            })()
                        };
                        return Player.username;
                    })
            ]);

            if(Finished)
                break;

            await timers.setTimeout(500);
        }

        if(WordList.size == 0) {
            return {
                Status: false,
                Reason: FailedReasons.NoPlayerAboveLevel50
            }
        }
        
        const Result: WordList = {
            Timestamp: Date.now(), 
            WordList: this.Shuffle([...WordList].filter(Word => !/[^A-Za-z0-9_.]/.test(Word)))
        };

        this.CachedWordList = Result;

        this.CacheWordListSTMT.run(Result.Timestamp, JSON.stringify(Result.WordList));
        for(const Username in Meta) {
            const UserMeta: Meta = Meta[Username];
            this.CacheMetaSTMT.run(Username, JSON.stringify(UserMeta.PlacementRange), UserMeta.Role ? JSON.stringify(UserMeta.Role) : null);
        }

        return {
            Status: true,
            WordList: Result,
            Meta
        };
    }

    // Wrapper for this.GetTodaysWordList()
    public get TodaysWordList(): Promise<Output> {
        return this.GetTodaysWordList();
    }

    private async GetTodaysGDSdle(): Promise<string> {
        if(this.CachedGDSdle && this.CachedWordList  && this.IsTodayUTC(this.CachedWordList.Timestamp))
            return this.CachedGDSdle;

        const Result: Output = await this.TodaysWordList;
        const WordList: string[] = Result.Status ? Result.WordList.WordList : [];

        if(WordList.length === 0)
            return "";

        const StartDate: number = Date.UTC(2007, 0, 1);
        const Now: Date = new Date();
        const NowUTC: number = Date.UTC(Now.getUTCFullYear(), Now.getUTCMonth(), Now.getUTCDate());

        const DaysSinceStart: number = Math.floor((NowUTC - StartDate) / 86400000);
        const Offset: number = Math.floor(WordList.length / 2);

        this.CachedGDSdle = WordList[(Offset + DaysSinceStart) % WordList.length];
        return this.CachedGDSdle;
    }

    // Wrapper for this.GetTodaysGDSdle()
    public get TodaysGDSdle(): Promise<string> {
        return this.GetTodaysGDSdle();
    }
}

export default new TodaysGDSdle();