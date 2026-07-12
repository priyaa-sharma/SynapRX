from fastapi import APIRouter, HTTPException, Query
from app.db import get_connection
from app import queries

router = APIRouter(prefix="/api/drugs", tags=["drugs"])


@router.get("")
async def list_drugs(class_name: str | None = Query(None, alias="class"), q: str | None = None):
    async with get_connection() as conn:
        return await queries.list_drugs(conn, class_name=class_name, search=q)


@router.get("/{drug_id}")
async def get_drug(drug_id: int):
    async with get_connection() as conn:
        drug = await queries.get_drug_detail(conn, drug_id)
        if not drug:
            raise HTTPException(status_code=404, detail="Drug not found")
        return drug


@router.get("/{drug_id}/interactions")
async def get_drug_interactions(drug_id: int):
    async with get_connection() as conn:
        drug = await queries.get_drug_detail(conn, drug_id)
        if not drug:
            raise HTTPException(status_code=404, detail="Drug not found")
        return await queries.get_interactions_for(conn, drug_id)
