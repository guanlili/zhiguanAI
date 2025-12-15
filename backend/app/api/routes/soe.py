import uuid
from datetime import datetime
from typing import Any
import pandas as pd
from io import BytesIO

from fastapi import APIRouter, HTTPException, File, UploadFile
from sqlmodel import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    RegulatoryUnit,
    RegulatoryUnitCreate,
    RegulatoryUnitPublic,
    RegulatoryUnitsPublic,
    RegulatoryUnitUpdate,
    SoeEnterprise,
    SoeEnterpriseCreate,
    SoeEnterprisePublic,
    SoeEnterprisesPublic,
    SoeEnterpriseUpdate,
)

router = APIRouter(prefix="/soe", tags=["soe"])


# ================= Regulatory Units =================


@router.get("/regulatory-units", response_model=RegulatoryUnitsPublic)
def read_regulatory_units(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve all regulatory units.
    """
    count_statement = select(func.count()).select_from(RegulatoryUnit)
    count = session.exec(count_statement).one()
    statement = (
        select(RegulatoryUnit)
        .order_by(RegulatoryUnit.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    units = session.exec(statement).all()
    return RegulatoryUnitsPublic(data=units, count=count)


@router.get("/regulatory-units/{id}", response_model=RegulatoryUnitPublic)
def read_regulatory_unit(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get regulatory unit by ID.
    """
    unit = session.get(RegulatoryUnit, id)
    if not unit:
        raise HTTPException(status_code=404, detail="Regulatory unit not found")
    return unit


@router.post("/regulatory-units", response_model=RegulatoryUnitPublic)
def create_regulatory_unit(
    *, session: SessionDep, current_user: CurrentUser, unit_in: RegulatoryUnitCreate
) -> Any:
    """
    Create new regulatory unit.
    """
    unit = RegulatoryUnit.model_validate(unit_in)
    session.add(unit)
    session.commit()
    session.refresh(unit)
    return unit


@router.put("/regulatory-units/{id}", response_model=RegulatoryUnitPublic)
def update_regulatory_unit(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    unit_in: RegulatoryUnitUpdate,
) -> Any:
    """
    Update a regulatory unit.
    """
    unit = session.get(RegulatoryUnit, id)
    if not unit:
        raise HTTPException(status_code=404, detail="Regulatory unit not found")
    update_dict = unit_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    unit.sqlmodel_update(update_dict)
    session.add(unit)
    session.commit()
    session.refresh(unit)
    return unit


@router.delete("/regulatory-units/{id}")
def delete_regulatory_unit(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a regulatory unit.
    """
    unit = session.get(RegulatoryUnit, id)
    if not unit:
        raise HTTPException(status_code=404, detail="Regulatory unit not found")
    session.delete(unit)
    session.commit()
    return Message(message="Regulatory unit deleted successfully")


# ================= SOE Enterprises =================


from sqlalchemy.orm import selectinload

@router.get("/enterprises", response_model=SoeEnterprisesPublic)
def read_enterprises(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    regulatory_unit_id: uuid.UUID | None = None,
) -> Any:
    """
    Retrieve all SOE enterprises. Optionally filter by regulatory_unit_id.
    """
    # Use selectinload to eagerly load the regulatory_unit relationship to avoid N+1 queries
    query = select(SoeEnterprise).options(selectinload(SoeEnterprise.regulatory_unit))
    if regulatory_unit_id:
        query = query.where(SoeEnterprise.regulatory_unit_id == regulatory_unit_id)
    
    # Count query needs to match the filter
    count_statement = select(func.count()).select_from(SoeEnterprise)
    if regulatory_unit_id:
        count_statement = count_statement.where(SoeEnterprise.regulatory_unit_id == regulatory_unit_id)

    count = session.exec(count_statement).one()
    
    statement = (
        query
        .order_by(SoeEnterprise.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    enterprises = session.exec(statement).all()
    
    result = []
    for ent in enterprises:
        ent_public = SoeEnterprisePublic.model_validate(ent)
        if ent.regulatory_unit:
            ent_public.regulatory_unit_name = ent.regulatory_unit.name
        result.append(ent_public)

    return SoeEnterprisesPublic(data=result, count=count)


@router.get("/enterprises/{id}", response_model=SoeEnterprisePublic)
def read_enterprise(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get enterprise by ID.
    """
    enterprise = session.get(SoeEnterprise, id)
    if not enterprise:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    
    ent_public = SoeEnterprisePublic.model_validate(enterprise)
    if enterprise.regulatory_unit:
        ent_public.regulatory_unit_name = enterprise.regulatory_unit.name
        
    return ent_public


@router.post("/enterprises", response_model=SoeEnterprisePublic)
def create_enterprise(
    *, session: SessionDep, current_user: CurrentUser, enterprise_in: SoeEnterpriseCreate
) -> Any:
    """
    Create new enterprise.
    """
    enterprise = SoeEnterprise.model_validate(enterprise_in)
    session.add(enterprise)
    session.commit()
    session.refresh(enterprise)
    
    ent_public = SoeEnterprisePublic.model_validate(enterprise)
    # Refresh might not load the relationship immediately, so we might need another get or just rely on IDs.
    # If newly created, regulatory_unit property might be empty until we access it or refresh with eager loading.
    # Simple fix: return what we have.
    
    return ent_public


@router.put("/enterprises/{id}", response_model=SoeEnterprisePublic)
def update_enterprise(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    enterprise_in: SoeEnterpriseUpdate,
) -> Any:
    """
    Update an enterprise.
    """
    enterprise = session.get(SoeEnterprise, id)
    if not enterprise:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    update_dict = enterprise_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    enterprise.sqlmodel_update(update_dict)
    session.add(enterprise)
    session.commit()
    session.refresh(enterprise)
    
    ent_public = SoeEnterprisePublic.model_validate(enterprise)
    if enterprise.regulatory_unit:
        ent_public.regulatory_unit_name = enterprise.regulatory_unit.name
    return ent_public


@router.delete("/enterprises/{id}")
def delete_enterprise(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an enterprise.
    """
    enterprise = session.get(SoeEnterprise, id)
    if not enterprise:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    session.delete(enterprise)
    session.commit()
    return Message(message="Enterprise deleted successfully")


@router.post("/import", response_model=Message)
def import_soe_data(
    session: SessionDep,
    file: UploadFile = File(...)
) -> Message:
    """
    Import SOE data from CSV or Excel file.
    Expected columns: '企业名称', '官网', '简介', '行业分类', '监管单位', 'Deepseek锐评'
    """
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(status_code=400, detail="Invalid file format. Please upload CSV or Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # Normalize columns
    # Map Chinese keys to model keys
    column_map = {
        '企业名称': 'name',
        '官网': 'website',
        '简介': 'description',
        '行业分类': 'category',
        '监管单位': 'regulatory_unit_name',
        'Deepseek锐评': 'deepseek_comment'
    }
    
    # Check if required columns exist in the first row or header
    # Check keys present
    missing_cols = []
    if '企业名称' not in df.columns:
        missing_cols.append("企业名称")
    if '监管单位' not in df.columns:
        missing_cols.append("监管单位")
    
    if missing_cols:
         raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

    df = df.rename(columns=column_map)
    df = df.where(pd.notnull(df), None) # Replace NaN with None

    success_count = 0
    updated_count = 0
    
    # Cache regulatory units to avoid repeating queries
    reg_units = session.exec(select(RegulatoryUnit)).all()
    reg_unit_map = {u.name: u for u in reg_units}

    for _, row in df.iterrows():
        name = row.get('name')
        reg_unit_name = row.get('regulatory_unit_name')
        
        if not name or not reg_unit_name:
            continue
        
        # Ensure name and reg_unit_name are strings
        name = str(name).strip()
        reg_unit_name = str(reg_unit_name).strip()

        # handle regulatory unit
        reg_unit = reg_unit_map.get(reg_unit_name)
        if not reg_unit:
            # Create new regulatory unit
            reg_unit = RegulatoryUnit(name=reg_unit_name)
            session.add(reg_unit)
            session.commit()
            session.refresh(reg_unit)
            reg_unit_map[reg_unit_name] = reg_unit

        # Check if enterprise exists
        enterprise = session.exec(select(SoeEnterprise).where(SoeEnterprise.name == name)).first()
        
        if enterprise:
            # Update
            enterprise.website = row.get('website')
            enterprise.description = row.get('description')
            enterprise.category = row.get('category')
            enterprise.deepseek_comment = row.get('deepseek_comment')
            enterprise.regulatory_unit_id = reg_unit.id
            session.add(enterprise)
            updated_count += 1
        else:
            # Create
            enterprise = SoeEnterprise(
                name=name,
                website=row.get('website'),
                description=row.get('description'),
                category=row.get('category'),
                deepseek_comment=row.get('deepseek_comment'),
                regulatory_unit_id=reg_unit.id
            )
            session.add(enterprise)
            success_count += 1
    
    session.commit()
    
    return Message(message=f"Import successful: {success_count} created, {updated_count} updated.")


@router.get("/template")
def get_soe_import_template() -> Any:
    """
    Download SOE import template.
    """
    from fastapi.responses import StreamingResponse
    
    df = pd.DataFrame(columns=['企业名称', '官网', '简介', '行业分类', '监管单位', 'Deepseek锐评'])
    # Add example row
    df.loc[0] = ['示例央企', 'https://example.com', '示例简介', '示例行业', '国务院国资委', 'Deepseek觉得很赞']
    
    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=soe_import_template.xlsx"}
    )
