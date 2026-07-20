import DB from "better-sqlite3";

const Database = new DB("GDSdle.db");
Database.pragma("journal_mode = WAL");
Database.exec(`
    CREATE TABLE IF NOT EXISTS CachedWordList(
        ID INTEGER PRIMARY KEY CHECK(ID = 1),
        Timestamp INTEGER NOT NULL,
        WordList TEXT NOT NULL
    );
        
    CREATE TABLE IF NOT EXISTS CachedMeta(
        Username PRIMARY KEY,
        PlacementRange TEXT NOT NULL,
        Role TEXT
    );

    CREATE TABLE IF NOT EXISTS PlayerProgress(
        PlayerID TEXT PRIMARY KEY,
        Progress TEXT NOT NULL,
        Tries INTEGER NOT NULL,
        Correct INTEGER NOT NULL,
        Done INTEGER NOT NULL
    );
            
    CREATE TABLE IF NOT EXISTS PlayerData(
        PlayerID TEXT PRIMARY KEY,
        Streak INTEGER NOT NULL DEFAULT 0,
        BestStreak INTEGER NOT NULL DEFAULT 0,
        TotalGames INTEGER NOT NULL DEFAULT 0,
        Win INTEGER NOT NULL DEFAULT 0,
        Missed INTEGER NOT NULL DEFAULT 0,
        Incomplete INTEGER NOT NULL DEFAULT 0,
        Loss INTEGER NOT NULL DEFAULT 0,
        LastPlayed INTEGER DEFAULT NULL,
        CreatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS TimeoutZone(
        PlayerID TEXT PRIMARY KEY,
        Timeout INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS TheShadowRealm(
        PlayerID TEXT PRIMARY KEY,
        By TEXT PRIMARY KEY,
        Reason TEXT PRIMARY KEY
    );
`);

export default Database;