from fastapi import APIRouter

from app.api.routes import items, job_applications, login, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(job_applications.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)

