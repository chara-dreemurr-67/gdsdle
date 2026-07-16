import type { MeeseeksLeaderboard } from "../types/MeeseeksLeaderboard.js";
import { EventEmitter } from "events";
import FetchMeeseeksAPI from "../helpers/FetchMeeseeksAPI.js";
import fs from "fs/promises";
import timers from "timers/promises";
import path from "path";
import crypto from "crypto";
import LoadEnv from "./LoadEnv.js";

export enum FailedReasons {
    GuildNotFound,
    NoPlayerAboveLevel50,
    APIError
}

interface WordList {
    TimeStamp: number;
    WordList: string[];
}


interface Succeeded {
    Status: true,
    WordList: WordList
}

interface Failed {
    Status: false,
    Reason: FailedReasons
}

type Output = 
    | Failed
    | Succeeded
;


class TodaysGDSdle extends EventEmitter {
    private CurrentFetch: Promise<Output> | undefined;
    private CachedWordList: WordList | undefined;
    private CachedGDSdle: string | undefined;

    public IsTodayUTC(TimeStamp: number): boolean {
        const TS: Date = new Date(TimeStamp);
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
        if(this.CachedWordList && this.IsTodayUTC(this.CachedWordList.TimeStamp)) {
            return {
                Status: true,
                WordList: this.CachedWordList
            };
        }

        if(this.CurrentFetch)
            return await this.CurrentFetch;

        this.CurrentFetch = (async (): Promise<Output> => {
            try {
                const CacheDir: string = path.join(import.meta.dirname, "cached");
                const CachedFile: string = path.join(CacheDir, "CachedGDSdle.json");

                await fs.mkdir(CacheDir, { recursive: true });
                try {
                    const WordList: WordList = JSON.parse(await fs.readFile(CachedFile, { encoding: "utf-8" }));

                    if(!this.IsTodayUTC(WordList.TimeStamp)) {
                        this.emit("newDay");
                        this.CachedGDSdle = undefined;
                        this.CachedWordList = undefined;
                    }
                    else {
                        this.CachedWordList = WordList;
                        return {
                            Status: true,
                            WordList
                        };
                    }
                }
                catch {}
                
                let Finished: boolean = false;
                let WordList: Set<string> = new Set<string>();

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
                                    if(Player.level < 50)
                                        Finished = true;
                                    return Player.level >= 50 && !/[^A-Za-z0-9_.]/.test(Player.username);
                                }
                            )
                            .map(Player => Player.username)
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
                    TimeStamp: Date.now(), 
                    WordList: this.Shuffle([...WordList].filter(Word => !/[^A-Za-z0-9_.]/.test(Word)))
                };

                this.CachedWordList = Result;

                const TempFile: string = CachedFile + ".tmp";
                await fs.writeFile(TempFile, JSON.stringify(Result, undefined, 4), { encoding: "utf-8" });
                await fs.rename(TempFile, CachedFile);

                return {
                    Status: true,
                    WordList: Result
                };
            }
            finally {
                this.CurrentFetch = undefined;
            }
        })();

        return await this.CurrentFetch;
    }

    // Wrapper for this.GetTodaysWordList()
    public get TodaysWordList(): Promise<Output> {
        return this.GetTodaysWordList();
    }

    private async GetTodaysGDSdle(): Promise<string> {
        if(this.CachedGDSdle && this.CachedWordList  && this.IsTodayUTC(this.CachedWordList.TimeStamp))
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