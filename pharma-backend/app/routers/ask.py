
from fastapi import APIRouter
from pydantic import BaseModel
from app.db import get_connection
from app import queries

router = APIRouter(prefix="/api/ask", tags=["ask"])


class AskRequest(BaseModel):
    question: str


@router.post("")
async def ask(payload: AskRequest):
    question = payload.question
    async with get_connection() as conn:
        mentioned = await queries.search_drugs_by_name_fragment(conn, question)
        lower_q = question.lower()
        mentioned = [d for d in mentioned if d["name"].lower() in lower_q]

        if len(mentioned) >= 2:
            a, b = mentioned[0], mentioned[1]
            interactions_a = await queries.get_interactions_for(conn, a["id"])
            match = next((i for i in interactions_a if i["other"]["id"] == b["id"]), None)
            if match:
                return {
                    "text": match["note"],
                    "citations": [{"label": match["source"]}],
                }
            return {
                "text": f"No recorded interaction between {a['name']} and {b['name']} in the current dataset. "
                        f"That doesn't necessarily mean there's no interaction — just that it isn't catalogued yet.",
                "citations": [],
            }

        if len(mentioned) == 1:
            drug = await queries.get_drug_detail(conn, mentioned[0]["id"])
            mech_text = ", ".join(f"{m['target']} ({m['action'].lower()})" for m in drug["mechanisms"])
            return {
                "text": f"{drug['name']} ({drug['brand']}) is a {drug['class']}, approved {drug['approved']}. "
                        f"Primary mechanism: {mech_text or 'not recorded'}.",
                "citations": [{"label": "SynapRX drug graph"}],
            }

        return {
            "text": "I couldn't find a drug name in that question. Try naming a specific drug, or two "
                    "drugs to check for an interaction.",
            "citations": [],
        }
