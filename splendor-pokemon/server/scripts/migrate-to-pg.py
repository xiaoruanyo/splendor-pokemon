"""Migrate data from SQLite to PostgreSQL"""
import sqlite3
import subprocess
import datetime

DB_PATH = "prisma/prod.db"
PG_URL = "postgresql://splendor:splendor_pg_2026@localhost:5432/splendor"


def ts(val):
    """Convert SQLite date value to PostgreSQL compatible date literal or NULL."""
    if val is None:
        return "NULL"
    s = str(val)
    # Unix timestamp in milliseconds?
    if s.isdigit() and len(s) >= 10:
        dt = datetime.datetime.utcfromtimestamp(int(s) / 1000.0)
        return f"'{dt.isoformat()}'"
    # Already ISO-ish
    return f"'{s}'"


def q(val):
    """Quote a string for SQL, or NULL if None."""
    if val is None:
        return "NULL"
    return f"'{str(val).replace(chr(39), chr(39)+chr(39))}'"


conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

users = [dict(r) for r in conn.execute("SELECT * FROM User")]
stats = [dict(r) for r in conn.execute("SELECT * FROM UserStats")]
codes = [dict(r) for r in conn.execute("SELECT * FROM ActivationCode")]
games = [dict(r) for r in conn.execute("SELECT * FROM GameRecord")]
game_players = [dict(r) for r in conn.execute("SELECT * FROM GameRecordPlayer")]

conn.close()

print(f"Found: {len(users)} users, {len(codes)} codes, {len(stats)} stats, {len(games)} games, {len(game_players)} game_players")


def psql(sql):
    r = subprocess.run(["psql", PG_URL, "-c", sql], capture_output=True, text=True)
    if r.returncode != 0 and "duplicate key" not in r.stderr.lower():
        print(f"  ERROR: {r.stderr.strip()[:200]}")
        return False
    return True


# Migrate users
for u in users:
    psql(
        f'INSERT INTO "User" (id, username, "passwordHash", avatar, "createdAt", "lastLoginAt") '
        f'VALUES ({q(u["id"])}, {q(u["username"])}, {q(u["passwordHash"])}, '
        f'{q(u.get("avatar", "🧢"))}, {ts(u["createdAt"])}, {ts(u.get("lastLoginAt"))})'
    )
print("Users done.")

# Migrate stats
for s in stats:
    psql(
        f'INSERT INTO "UserStats" (id, "userId", "totalGames", wins, losses, "highestScore", "avgScore", "ratingElo") '
        f'VALUES ({q(s["id"])}, {q(s["userId"])}, {s["totalGames"]}, {s["wins"]}, '
        f'{s["losses"]}, {s["highestScore"]}, {s["avgScore"]}, {s["ratingElo"]})'
    )
print("Stats done.")

# Migrate codes
for c in codes:
    is_used = "true" if c["isUsed"] else "false"
    psql(
        f'INSERT INTO "ActivationCode" (id, code, "isUsed", "usedBy", "usedAt", "createdAt") '
        f'VALUES ({q(c["id"])}, {q(c["code"])}, {is_used}, '
        f'{q(c.get("usedBy"))}, {ts(c.get("usedAt"))}, {ts(c["createdAt"])})'
    )
print("Codes done.")

# Migrate games
for g in games:
    psql(
        f'INSERT INTO "GameRecord" (id, mode, "playerCount", "winnerId", "finalScores", "createdAt") '
        f'VALUES ({q(g["id"])}, {q(g["mode"])}, {g["playerCount"]}, {q(g.get("winnerId"))}, '
        f'{q(g["finalScores"])}, {ts(g["createdAt"])})'
    )
print("Games done.")

# Migrate game players
for gp in game_players:
    psql(
        f'INSERT INTO "GameRecordPlayer" (id, "gameRecordId", "userId", score, rank) '
        f'VALUES ({q(gp["id"])}, {q(gp["gameRecordId"])}, {q(gp["userId"])}, '
        f'{gp["score"]}, {gp["rank"]})'
    )
print("Game players done.")

# ---- Verify ----
print("\n=== Verification ===")
r = subprocess.run(
    ["psql", PG_URL, "-c",
     'SELECT code, "isUsed" FROM "ActivationCode" LIMIT 10'],
    capture_output=True, text=True
)
print(r.stdout)
r = subprocess.run(
    ["psql", PG_URL, "-c",
     'SELECT count(*) as total FROM "ActivationCode"'],
    capture_output=True, text=True
)
print(r.stdout)
