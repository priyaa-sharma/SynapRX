
DRUG_BASE_QUERY = """
SELECT d.id, d.name, d.brand_names, d.approval_year, d.half_life_hours, d.route,
       dc.name AS class_name
FROM drugs d
JOIN drug_classes dc ON dc.id = d.class_id
"""


async def list_drugs(conn, class_name: str | None = None, search: str | None = None):
    query = DRUG_BASE_QUERY
    conditions = []
    params = []
    if class_name:
        params.append(class_name)
        conditions.append(f"dc.name = ${len(params)}")
    if search:
        params.append(f"%{search.lower()}%")
        conditions.append(
            f"(LOWER(d.name) LIKE ${len(params)} OR EXISTS "
            f"(SELECT 1 FROM unnest(d.brand_names) b WHERE LOWER(b) LIKE ${len(params)}))"
        )
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY d.name"
    rows = await conn.fetch(query, *params)
    return [_row_to_drug_summary(r) for r in rows]


async def get_drug_detail(conn, drug_id: int):
    drug_row = await conn.fetchrow(DRUG_BASE_QUERY + " WHERE d.id = $1", drug_id)
    if not drug_row:
        return None

    mechanisms = await conn.fetch(
        "SELECT target, action, is_primary FROM mechanisms WHERE drug_id = $1 ORDER BY is_primary DESC",
        drug_id,
    )
    metabolism = await conn.fetch(
        "SELECT enzyme, role, strength FROM metabolism WHERE drug_id = $1 ORDER BY enzyme",
        drug_id,
    )
    history = await conn.fetch(
        """
        SELECT year_label, sort_year, title, description
        FROM history_events
        WHERE drug_id = $1
        ORDER BY sort_year
        """,
        drug_id,
    )

    return {
        **_row_to_drug_summary(drug_row),
        "mechanisms": [dict(m) for m in mechanisms],
        "metabolism": [dict(m) for m in metabolism],
        "history": [dict(h) for h in history],
    }


async def get_interactions_for(conn, drug_id: int):
    rows = await conn.fetch(
        """
        SELECT i.risk_level, i.risk_label, i.mechanism_note, i.source,
               other.id AS other_id, other.name AS other_name, oc.name AS other_class
        FROM interactions_symmetric s
        JOIN interactions i ON (i.drug_a_id = s.drug_id AND i.drug_b_id = s.other_drug_id)
                            OR (i.drug_b_id = s.drug_id AND i.drug_a_id = s.other_drug_id)
        JOIN drugs other ON other.id = s.other_drug_id
        JOIN drug_classes oc ON oc.id = other.class_id
        WHERE s.drug_id = $1
        """,
        drug_id,
    )
    return [
        {
            "risk": r["risk_level"],
            "label": r["risk_label"],
            "note": r["mechanism_note"],
            "source": r["source"],
            "other": {"id": r["other_id"], "name": r["other_name"], "class": r["other_class"]},
        }
        for r in rows
    ]


async def get_cyp450_overlaps(conn):
    rows = await conn.fetch("""
        SELECT inhibitor_drug_id, inhibitor_name, substrate_drug_id, substrate_name,
               enzyme, inhibitor_strength
        FROM cyp450_overlap_risks
        ORDER BY inhibitor_name
    """)
    return [dict(r) for r in rows]


async def get_metabolism_table(conn):
    rows = await conn.fetch("""
        SELECT d.id, d.name, m.enzyme, m.role, m.strength
        FROM drugs d
        JOIN metabolism m ON m.drug_id = d.id
        ORDER BY d.name
    """)
    table = {}
    for r in rows:
        table.setdefault(r["id"], {"id": r["id"], "name": r["name"], "entries": []})
        table[r["id"]]["entries"].append(
            {"enzyme": r["enzyme"], "role": r["role"], "strength": r["strength"]}
        )
    return list(table.values())


async def get_history(conn, class_name: str | None = None):
    query = """
        SELECT COALESCE(d.name, '(class-wide)') AS drug_name, d.id AS drug_id,
               h.year_label, h.sort_year, h.title, h.description, dc.name AS class_name
        FROM history_events h
        LEFT JOIN drugs d ON d.id = h.drug_id
        JOIN drug_classes dc ON dc.id = COALESCE(h.class_id, d.class_id)
    """
    params = []
    if class_name:
        params.append(class_name)
        query += f" WHERE dc.name = ${len(params)}"
    query += " ORDER BY h.sort_year"
    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


async def search_drugs_by_name_fragment(conn, fragment: str):
    """Used by the /ask endpoint to find drugs mentioned in a question."""
    rows = await conn.fetch(
        """
        SELECT d.id, d.name FROM drugs d
        WHERE LOWER(d.name) LIKE $1
           OR EXISTS (SELECT 1 FROM unnest(d.brand_names) b WHERE LOWER(b) LIKE $1)
        """,
        f"%{fragment.lower()}%",
    )
    return [dict(r) for r in rows]


def _row_to_drug_summary(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "brand": ", ".join(row["brand_names"]) if row["brand_names"] else None,
        "class": row["class_name"],
        "approved": row["approval_year"],
        "halfLife": f"{row['half_life_hours']} hours" if row["half_life_hours"] else None,
        "route": row["route"],
    }
