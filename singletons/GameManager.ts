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
}

interface PlayerInfo {
    Progress: Tiles[][];
    Tries: number;
    Correct: boolean;
}

class GM {
    private readonly PlayerRegistry: Map<string, PlayerInfo> = new Map<string, PlayerInfo>();

    public async GetProgressBoard(PlayerID: string): Promise<string> {
        // Has been guarded by caller.
        const Player: PlayerInfo = this.PlayerRegistry.get(PlayerID)!;
        const ProgressBoard: string[] = Player.Progress.map(Row => Row.join(""));
        ProgressBoard.push(...new Array<string>(LoadEnv.MAX_TRIES - Player.Progress.length).fill("⬜".repeat((await TodaysGDSdle.TodaysGDSdle).length)));
        return ProgressBoard.join("\n");
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
        this.PlayerRegistry.get(PlayerID)!.Progress.push(Progress);
        this.PlayerRegistry.get(PlayerID)!.Tries += 1;
        return {
            Correct: Guess == Answer,
            Progress
        };
    }

    public Get(PlayerID: string): PlayerInfo | undefined {
        return this.PlayerRegistry.get(PlayerID);
    }

    public Clear(): void {
        this.PlayerRegistry.clear();
    }

    public Has(PlayerID: string): boolean {
        return this.PlayerRegistry.has(PlayerID);
    }

    public New(PlayerID: string): void {
        this.PlayerRegistry.set(PlayerID, {
            Progress: [],
            Correct: false,
            Tries: 0
        });
    }
}

const GameManager = new GM();

TodaysGDSdle.on("newDay", () => GameManager.Clear());

export default GameManager;