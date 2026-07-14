"""Radar project + channel + rule CRUD."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import QueryRule, RadarProject, SourceChannel
from app.schemas import (
    QueryRuleIn,
    QueryRuleOut,
    RadarProjectIn,
    RadarProjectOut,
    SourceChannelIn,
    SourceChannelOut,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


async def _get_project(db: AsyncSession, project_id: int) -> RadarProject:
    p = await db.get(RadarProject, project_id)
    if not p:
        raise HTTPException(404, "project not found")
    return p


@router.post("", response_model=RadarProjectOut)
async def create_project(body: RadarProjectIn, db: AsyncSession = Depends(get_db)):
    p = RadarProject(**body.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.get("", response_model=list[RadarProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(RadarProject).order_by(RadarProject.id)))


@router.get("/{project_id}", response_model=RadarProjectOut)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_project(db, project_id)


@router.patch("/{project_id}", response_model=RadarProjectOut)
async def update_project(project_id: int, body: RadarProjectIn, db: AsyncSession = Depends(get_db)):
    p = await _get_project(db, project_id)
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/{project_id}/channels", response_model=SourceChannelOut)
async def add_channel(project_id: int, body: SourceChannelIn, db: AsyncSession = Depends(get_db)):
    await _get_project(db, project_id)
    ch = SourceChannel(project_id=project_id, **body.model_dump())
    db.add(ch)
    await db.commit()
    await db.refresh(ch)
    return ch


@router.get("/{project_id}/channels", response_model=list[SourceChannelOut])
async def list_channels(project_id: int, db: AsyncSession = Depends(get_db)):
    return list(
        await db.scalars(select(SourceChannel).where(SourceChannel.project_id == project_id))
    )


@router.post("/{project_id}/rules", response_model=QueryRuleOut)
async def add_rule(project_id: int, body: QueryRuleIn, db: AsyncSession = Depends(get_db)):
    await _get_project(db, project_id)
    r = QueryRule(project_id=project_id, **body.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return r


@router.get("/{project_id}/rules", response_model=list[QueryRuleOut])
async def list_rules(project_id: int, db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(QueryRule).where(QueryRule.project_id == project_id)))
