import uuid

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import database
from backend.routes.companies import (
    CompanyBatchOutput,
    fetch_companies_with_liked,
    CompanyOutput
)

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)


class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str


class CompanyCollectionOutput(CompanyBatchOutput, CompanyCollectionMetadata):
    pass


@router.get("", response_model=list[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()

    return [
        CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
        )
        for collection in collections
    ]


@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: uuid.UUID,
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    query = (
        db.query(database.CompanyCollectionAssociation, database.Company)
        .join(database.Company)
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
    )

    total_count = query.with_entities(func.count()).scalar()

    results = query.offset(offset).limit(limit).all()
    companies = fetch_companies_with_liked(db, [company.id for _, company in results])

    return CompanyCollectionOutput(
        id=collection_id,
        collection_name=db.query(database.CompanyCollection)
        .get(collection_id)
        .collection_name,
        companies=companies,
        total=total_count,
    )

@router.get("/{collection_id}/companies/all", response_model=CompanyBatchOutput)
def get_all_companies_in_collection(
    collection_id: uuid.UUID, 
    db: Session = Depends(database.get_db),  
):
    """
    Fetch all companies that belong to a specific collection.
    """
    companies = (
        db.query(database.Company)
        .join(database.CompanyCollectionAssociation) 
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
        .all()
    )

    if not companies:
        raise HTTPException(status_code=404, detail="No companies found for this collection.")

    company_outputs = [
        CompanyOutput(
            id=company.id,
            company_name=company.company_name,
            liked=False
        )
        for company in companies
    ]

    return CompanyBatchOutput(
        companies=company_outputs,
        total=len(company_outputs)
    )