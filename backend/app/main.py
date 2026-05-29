from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config.config import settings
from app.config.database import get_session
from app.modules.knowledge_base.routes import router as knowledge_base_router
from app.modules.tickets.routes import router as tickets_router
from app.modules.ticket_messages.routes import router as ticket_messages_router
from app.modules.sla.routes import router as sla_router
from app.modules.integration.routes import router as integration_router
from app.modules.auth.routes import router as auth_router


print("[DEBUG] app.main loaded")
print(f"[DEBUG] settings: app_name={settings.app_name}, app_debug={settings.app_debug}")


def create_app() -> FastAPI:
    print("[DEBUG] create_app() called")
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        docs_url="/docs" if settings.app_debug else None,
        redoc_url="/redoc" if settings.app_debug else None,
    )

    # CORS — frontend (Vite dev + nginx em prod) consome /api/v1/*
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", status_code=200, tags=["Health"])
    def health(session=Depends(get_session)):
        try:
            session.execute(text("SELECT 1"))
            return {"status": "ok", "db": "connected"}
        except SQLAlchemyError as exc:
            raise HTTPException(status_code=503, detail=f"database unavailable: {exc}")

    prefix = settings.api_prefix  # "/api/v1"

    app.include_router(auth_router, prefix=prefix)
    app.include_router(knowledge_base_router, prefix=prefix)
    app.include_router(tickets_router, prefix=prefix)
    app.include_router(ticket_messages_router, prefix=prefix)
    app.include_router(sla_router, prefix=prefix)
    app.include_router(integration_router, prefix=prefix)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    print("[DEBUG] Running as script (py -m app.main)")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=settings.app_debug)
