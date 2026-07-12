from fastapi import APIRouter, Query
from app.db import get_connection
from app import queries

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
async def history(class_name: str | None = Query(None, alias="class")):
    async with get_connection() as conn:
        return await queries.get_history(conn, class_name=class_name)
