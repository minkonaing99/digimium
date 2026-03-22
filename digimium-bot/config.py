import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"


def load_env(env_path=ENV_PATH):
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')

        if key and key not in os.environ:
            os.environ[key] = value


load_env()


def get_required_env(name):
    value = os.getenv(name)
    if value in (None, ""):
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


BOT_TOKEN = get_required_env("BOT_TOKEN")
BOT_PASSWORD = get_required_env("BOT_PASSWORD")
CHANNEL_ID = get_required_env("CHANNEL_ID")

DB_CONFIG = {
    "host": get_required_env("DB_HOST"),
    "user": get_required_env("DB_USER"),
    "password": get_required_env("DB_PASSWORD"),
    "database": get_required_env("DB_NAME"),
    "port": int(os.getenv("DB_PORT", "3306")),
}
