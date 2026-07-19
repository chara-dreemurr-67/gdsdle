import Database from "../Database.js";
import DataManager from "./DataManager.js";
import LoadEnv from "./LoadEnv.js";
import TodaysGDSdle from "./TodaysGDSdle.js";

// Green = Correct; Yellow = Correct, but wrong spot; Black = incorrect; White = filler
export enum Tiles {
    Green = "🟩",
    Yellow = "🟨",
    Black = "⬛",
    White = "⬜"
}

interface GuessResult {
    Progress: Tiles[];
    Correct: boolean;
    Done: boolean;
}

interface PlayerInfo {
    Progress: Tiles[][];
    Tries: number;
    Correct: boolean;
    Done: boolean;
}

interface PlayerProgressRow {
    PlayerID: string;
    Progress: string;
    Tries: number;
    Correct: number;
    Done: number;
}

type PlayerRegistry = Map<string, PlayerInfo>;

class GameManager {
    private readonly PlayerRegistry: PlayerRegistry;
    private readonly GetPlayerSTMT = Database.prepare<[string], PlayerProgressRow>(`
        SELECT * FROM PlayerProgress
        WHERE PlayerID = ?
    `);
    private readonly SavePlayerSTMT = Database.prepare(`
        INSERT INTO PlayerProgress
        (PlayerID, Progress, Tries, Correct)
        Value(?, ?, ?, ?)
        ON CONFLICT(PlayerID)
        DO UPDATE SET
            Progress = excluded.Progress,
            Tries = excluded.Tries,
            Correct = excluded.Correct
            Done = excluded.Done
    `);
    private readonly CreatePlayerSTMT = Database.prepare(`
        INSERT OR REPLACE INTO PlayerProgress
        (PlayerID, Progress, Tries, Correct, Done)
        VALUES(?, ?, ?, ?, ?)
    `);

    public constructor() {
        this.PlayerRegistry = new Map((Database.prepare("SELECT * FROM PlayerProgress").all() as PlayerProgressRow[])
            .map(Row => [Row.PlayerID, { Progress: JSON.parse(Row.Progress), Tries: Row.Tries, Correct: !!Row.Correct, Done: !!Row.Done }]))
        ;
        TodaysGDSdle.on("newDay", () => this.Clear());
    }

    public LoadPlayer(PlayerID: string): void {
        const Row: PlayerProgressRow | undefined = this.GetPlayerSTMT.get(PlayerID);

        if(!Row)
            return this.New(PlayerID);

        this.PlayerRegistry.set(PlayerID, {
            Progress: JSON.parse(Row.Progress),
            Tries: Row.Tries,
            Correct: !!Row.Correct,
            Done: !!Row.Done
        });
    }

    public SavePlayer(PlayerID: string): void {
        const Player: PlayerInfo | undefined = this.PlayerRegistry.get(PlayerID);
        if(!Player)
            return;

        this.SavePlayerSTMT.run(
            PlayerID,
            JSON.stringify(Player.Progress),
            Player.Tries,
            Number(Player.Correct)
        );
    }

    public Guess(PlayerID: string, Guess: string, Answer: string): GuessResult {
        const Progress: Tiles[] = Array<Tiles>(Answer.length).fill(Tiles.Black);
        const Remaining: Record<string, number> = {};

        for(let i: number = 0; i < Answer.length; i++) {
            if(Guess[i] === Answer[i])
                Progress[i] = Tiles.Green;
            else {
                Remaining[Answer[i]] ??= 0;
                Remaining[Answer[i]]++;
            }
        }

        for(let i: number = 0; i < Answer.length; i++) {
            if(Progress[i] === Tiles.Green)
                continue;

            const Char: string = Guess[i];
            if((Remaining[Char] ?? 0) > 0) {
                Progress[i] = Tiles.Yellow;
                Remaining[Char]--;
            }
        }

        // Also has been guarded by caller.
        const Player: PlayerInfo = this.PlayerRegistry.get(PlayerID)!;
        Player.Progress.push(Progress);
        Player.Tries++;
        Player.Correct = Guess === Answer;
        Player.Done = Player.Correct || Player.Tries === LoadEnv.MAX_TRIES;
        this.SavePlayer(PlayerID);

        const GetResult = DataManager.GetProfile(PlayerID);
        if(!GetResult.Status) {
            return {
                Correct: Guess == Answer,
                Progress,
                Done: Player.Done
            };
        }
        const PlayerProfile = GetResult.Profile;
        let Streak: number = PlayerProfile.Streak;
        let BestStreak: number = PlayerProfile.BestStreak;
        let Win: number = PlayerProfile.Win;
        let Loss: number = PlayerProfile.Loss;
        let LastPlayed: number = Date.now();
        
        if(Player.Done) {
            Streak = Player.Correct ? PlayerProfile.Streak + 1 : 0;
            BestStreak = PlayerProfile.BestStreak < Streak ? Streak : PlayerProfile.BestStreak;
            Win = PlayerProfile.Win + (Player.Correct ? 1 : 0);
            Loss = PlayerProfile.Loss + (Player.Correct ? 0 : 1);
        }

        DataManager.UpdateProfile(PlayerID, {
            Streak,
            BestStreak,
            Win,
            Loss,
            LastPlayed
        });

        return {
            Correct: Guess == Answer,
            Progress,
            Done: Player.Done
        };
    }

    public Get(PlayerID: string): PlayerInfo | undefined {
        return this.PlayerRegistry.get(PlayerID);
    }

    public Clear(): void {
        for(const PlayerID in DataManager.GetAll()) {
            const Result = DataManager.GetProfile(PlayerID);
            if(!Result.Status)
                continue;

            const PlayerProfile = Result.Profile;
            if(!this.PlayerRegistry.has(PlayerID)) {
                DataManager.UpdateProfile(PlayerID, { Missed: PlayerProfile.Missed + 1 });
                continue;
            }

            const TodayProgress = this.PlayerRegistry.get(PlayerID)!;
            if(!TodayProgress.Done) {
                DataManager.UpdateProfile(PlayerID, { Incomplete: PlayerProfile.Incomplete + 1 });
            }
        }
        this.PlayerRegistry.clear();
        Database.prepare("DELETE FROM PlayerProgress").run();
    }

    public Has(PlayerID: string): boolean {
        return this.PlayerRegistry.has(PlayerID);
    }

    public New(PlayerID: string): void {
        const Player: PlayerInfo = {
            Progress: [],
            Correct: false,
            Done: false,
            Tries: 0
        };

        this.PlayerRegistry.set(PlayerID, Player);
        this.CreatePlayerSTMT.run(
            PlayerID,
            JSON.stringify(Player.Progress),
            Player.Tries,
            Number(Player.Done),
            Number(Player.Correct)
        );
    }
}

export default new GameManager();