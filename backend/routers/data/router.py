from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
import os
from sqlalchemy import create_engine, text, inspect
import config

router = APIRouter(prefix="/data", tags=["data"])

# Database setup
db_url = os.getenv("DATABASE_URL")
if not db_url:
    # Fallback to config if env not loaded yet
    import dotenv
    dotenv.load_dotenv()
    db_url = os.getenv("DATABASE_URL")

engine = create_engine(db_url)

@router.get("/tables")
async def get_tables():
    """List all available tables in the database."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        # Exclude system tables if any
        return sorted(tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table/{table_name}")
async def get_table_data(
    table_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=10, le=1000),
    search: str = Query(None),
    sort_col: str = Query(None),
    sort_dir: str = Query("ascending") # ascending | descending
):
    """Fetch paginated, sorted, and filtered data for a specific table."""
    try:
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(status_code=404, detail="Table not found")

        offset = (page - 1) * page_size
        
        # Build query parts
        where_clause = ""
        params = {"limit": page_size, "offset": offset}
        
        if search:
            # Simple global search: check all columns as string
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            search_conditions = [f'CAST("{col}" AS TEXT) ILIKE :search' for col in columns]
            where_clause = "WHERE " + " OR ".join(search_conditions)
            params["search"] = f"%{search}%"

        order_clause = ""
        if sort_col:
            direction = "DESC" if sort_dir == "descending" else "ASC"
            # Validate sort_col to prevent SQL injection
            allowed_cols = [col['name'] for col in inspector.get_columns(table_name)]
            print(f"Table: {table_name}, Allowed cols: {allowed_cols}, Sort request: {sort_col} {direction}")
            if sort_col in allowed_cols:
                order_clause = f'ORDER BY "{sort_col}" {direction}'
            else:
                print(f"WARNING: sort_col '{sort_col}' not found in allowed_cols")

        with engine.connect() as conn:
            # Total count with filter
            count_query = text(f'SELECT COUNT(*) FROM "{table_name}" {where_clause}')
            total_count = conn.execute(count_query, params if search else {}).scalar()

            # Data query
            sql = f'SELECT * FROM "{table_name}" {where_clause} {order_clause} LIMIT :limit OFFSET :offset'
            print(f"Executing SQL: {sql} with params: {params}")
            data_query = text(sql)
            result = conn.execute(data_query, params)
            
            cols = result.keys()
            rows = [dict(zip(cols, row)) for row in result]

            return {
                "table": table_name,
                "columns": list(cols),
                "data": rows,
                "total": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size
            }
    except Exception as e:
        print(f"Error fetching table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
