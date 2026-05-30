from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import all models so Alembic can detect them
# Dynamically import all submodules under `app.modules` so new models
# are automatically registered in `Base.metadata` without manual edits.
import importlib
import pkgutil
import app.modules  # noqa: F401

package = app.modules
for finder, name, ispkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
    try:
        importlib.import_module(name)
    except Exception:
        # ignore problematic imports to avoid breaking Alembic env;
        # failing modules can be fixed separately
        pass

from app.config.config import settings
from app.config.database import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
