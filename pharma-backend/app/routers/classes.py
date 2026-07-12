from fastapi import APIRouter
from app.db import get_connection

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("")
async def list_classes():
    async with get_connection() as conn:
        rows = await conn.fetch("SELECT name, full_name, description FROM drug_classes ORDER BY name")
        return [dict(r) for r in rows]
