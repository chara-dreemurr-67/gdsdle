import Database from "../Database.js";
import LoadEnv from "./LoadEnv.js";

export enum QueryFailedReasons {
    PlayerNotFound
}

export enum CreateFailedReasons {
    PlayerAlreadyExist
}

interface PlayerData {
    Streak: number;
    BestStreak: number;
    TotalGames: number;
    Win: number;
    Missed: number;
    Incomplete: number;
    Loss: number;
    get Winrate(): number;
    LastPlayed: number | null;
    CreatedAt: number;
}

interface UpdateArgument {
    Streak?: number;
    BestStreak?: number;
    TotalGames?: number;
    Win?: number;
    Missed?: number;
    Incomplete?: number;
    Loss?: number;
    LastPlayed?: number | null;
}

interface PlayerDataRow extends PlayerData {
    PlayerID: string;
}

interface QueryTSRSucceeded {
    Status: true;
    Timeout: number;
}

type QueryTSRResult = 
    | QueryTSRSucceeded
    | QueryFailed
;

type TSR = Map<string, { By: string; Reason: string; }>;

interface TSRRow {
    PlayerID: string;
    By: string;
    Reason: string;
}

type DeleteResult = UpdateResult;
type UnbanResult = UpdateResult;

type BanResult = 
    | CreateSucceeded
    | CreateFailed
;

type UpdateResult = 
    | CreateSucceeded
    | QueryFailed
;

interface CreateSucceeded {
    Status: true;
}

interface CreateFailed {
    Status: false;
    Reason: CreateFailedReasons;
}

type CreateResult = 
    | CreateSucceeded
    | CreateFailed
;

interface QuerySucceeded {
    Status: true;
    Profile: PlayerData;
}

interface QueryFailed {
    Status: false;
    Reason: QueryFailedReasons;
}

type QueryResult = 
    | QuerySucceeded
    | QueryFailed
;

type Player = Map<string, PlayerData>;

interface TimeoutZoneRow {
    PlayerID: string;
    Timeout: number;
}

type TimeoutZone = Map<string, number>;

class DataManager {
    private readonly Players: Player;
    private readonly TimeoutZone: TimeoutZone;
    private readonly TheShadowRealm: TSR;
    private readonly BanSTMT = Database.prepare(`
        INSERT OF REPLACE INTO TheShadowRealm
        (PlayerID, By, Reason)
        VALUES(?, ?, ?)
    `);
    private readonly UnbanSTMT = Database.prepare("DELETE FROM TheShadowRealm WHERE PlayerID = ?");
    private readonly RemoveTimeoutSTMT = Database.prepare("DELETE FROM TimeoutZone WHERE PlayerID = ?");
    private readonly DeleteProfileSTMT = Database.transaction((PlayerID: string, Timeout: number): void => {
        Database.prepare("DELETE FROM PlayerProgress WHERE PlayerID = ?").run(PlayerID);
        Database.prepare(`
            INSERT OR REPLACE INTO TimeoutZone
            (PlayerID, Timeout)
            VALUES(?, ?)
        `).run(PlayerID, Timeout);
    });
    private readonly CreateProfileSTMT = Database.prepare(`
        INSERT OR REPLACE INTO PlayerProgress
        (PlayerID, CreatedAt)
        VALUES(?, ?)
    `);
    // I wrote a script just to generate this btw
    private readonly ModifyProfileSTMT = Database.prepare(`
        INSERT OR REPLACE INTO PlayerProgress
        (PlayerID, Streak, BestStreak, TotalGames, Win, Missed, Incomplete, Loss, LastPlayed)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(PlayerID)
        DO UPDATE SET
            PlayerID = excluded.PlayerID,
            Streak = excluded.Streak,
            BestStreak = excluded.BestStreak,
            TotalGames = excluded.TotalGames,
            Win = excluded.Win,
            Missed = excluded.Missed,
            Incomplete = excluded.Incomplete,
            Loss = excluded.Loss,
            LastPlayed = excluded.LastPlayed
    `);

    public constructor() {
        this.Players = new Map<string, PlayerData>(
            (Database.prepare("SELECT * FROM PlayerData").all() as PlayerDataRow[]).map(Row =>
                [
                    Row.PlayerID,
                    {
                        Streak: Row.Streak,
                        BestStreak: Row.BestStreak,
                        TotalGames: Row.TotalGames,
                        Win: Row.Win,
                        Missed: Row.Missed,
                        Incomplete: Row.Incomplete,
                        Loss: Row.Loss,
                        get Winrate(): number {
                            return this.Win / this.TotalGames
                        },
                        LastPlayed: Row.LastPlayed,
                        CreatedAt: Row.CreatedAt
                    }
                ]
            )
        );
        this.TimeoutZone = new Map<string, number>(
            (Database.prepare("SELECT * FROM TimeoutZone").all() as TimeoutZoneRow[]).map(Row => [Row.PlayerID, Row.Timeout])
        );
        this.TheShadowRealm = new Map((Database.prepare("SELECT * FROM TheShadowRealm").all() as TSRRow[])
            .map(Player => [Player.PlayerID, { By: Player.By, Reason: Player.Reason }]))
        ;
    }

    public Unban(PlayerID: string): UnbanResult {
        if(!this.TheShadowRealm.has(PlayerID)) {
            return {
                Status: false,
                Reason: QueryFailedReasons.PlayerNotFound
            };
        }

        this.TheShadowRealm.delete(PlayerID);
        this.UnbanSTMT.run(PlayerID);
        return { Status: true };
    }

    public Ban(PlayerID: string, By: string, Reason: string): BanResult {
        if(this.TheShadowRealm.has(PlayerID)) {
            return {
                Status: false,
                Reason: CreateFailedReasons.PlayerAlreadyExist
            };
        }
        this.TheShadowRealm.set(PlayerID, { By, Reason });
        this.BanSTMT.run(PlayerID, By, Reason);
        return { Status: true };
    }

    public GetAll(): Map<string, PlayerData> {
        return this.Players;
    } 

    public GetProfile(PlayerID: string): QueryResult {
        const Player: PlayerData | undefined = this.Players.get(PlayerID);
        if(!Player) {
            return {
                Status: false,
                Reason: QueryFailedReasons.PlayerNotFound
            };
        }

        return {
            Status: true,
            Profile: Player
        };
    }

    public CreateProfile(PlayerID: string): CreateResult {
        if(this.Players.has(PlayerID)) {
            return {
                Status: false,
                Reason: CreateFailedReasons.PlayerAlreadyExist
            };
        }

        const CreatedAt: number = Date.now();

        this.Players.set(PlayerID, {
            Streak: 0,
            BestStreak: 0,
            TotalGames: 0,
            Win: 0,
            Missed: 0,
            Incomplete: 0,
            Loss: 0,
            get Winrate(): number {
                return this.Win / this.TotalGames
            },
            LastPlayed: null,
            CreatedAt
        });
        this.CreateProfileSTMT.run(PlayerID, CreatedAt);
        return { Status: true };
    }

    public UpdateProfile(PlayerID: string, PlayerData: UpdateArgument): UpdateResult {
        const Player: PlayerData | undefined = this.Players.get(PlayerID);
        if(!Player) {
            return {
                Status: false,
                Reason: QueryFailedReasons.PlayerNotFound
            }
        }

        const UpdateKeys: Array<keyof UpdateArgument> = [
            "Streak",
            "BestStreak",
            "TotalGames",
            "Win",
            "Missed",
            "Incomplete",
            "Loss",
            "LastPlayed"
        ];

        for(const Key of UpdateKeys) {
            const Value = PlayerData[Key];
            if(Value) {
                Player[Key] = Value;
            }
        }

        this.ModifyProfileSTMT.run(
            PlayerID,
            Player.Streak,
            Player.BestStreak,
            Player.TotalGames,
            Player.Win,
            Player.Missed,
            Player.Incomplete,
            Player.Loss,
            Player.LastPlayed,
            Player.CreatedAt
        );
        return { Status: true };
    }

    public RemoveProfile(PlayerID: string): DeleteResult {
        const Player: PlayerData | undefined = this.Players.get(PlayerID);
        if(!Player) {
            return {
                Status: false,
                Reason: QueryFailedReasons.PlayerNotFound
            }
        }
        const Timeout: number = Date.now() + LoadEnv.TIMEOUT_DURATION;
        this.Players.delete(PlayerID);
        this.TimeoutZone.set(PlayerID, Timeout);
        this.DeleteProfileSTMT(PlayerID, Timeout);
        return { Status: true };
    }

    public GetTimeout(PlayerID: string): QueryTSRResult {
        const Timeout: number | undefined = this.TimeoutZone.get(PlayerID);
        if(!Timeout) {
            return {
                Status: false,
                Reason: QueryFailedReasons.PlayerNotFound
            }
        }
        if(Date.now() >= Timeout) {
            this.TimeoutZone.delete(PlayerID);
            this.RemoveTimeoutSTMT.run(PlayerID);
        }
        return {
            Status: true,
            Timeout
        }
    }

    public HasProfile(PlayerID: string): boolean {
        return this.Players.has(PlayerID);
    }
}

export default new DataManager();