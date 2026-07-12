from fastapi import APIRouter
from app.db import get_connection
from app import queries

router = APIRouter(prefix="/api/metabolism", tags=["metabolism"])


@router.get("/table")
async def metabolism_table():
    async with get_connection() as conn:
        return await queries.get_metabolism_table(conn)


@router.get("/overlaps")
async def metabolism_overlaps():
    async with get_connection() as conn:
        return await queries.get_cyp450_overlaps(conn)
