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
    collection_id: uuid.UUID,  # Collection is identified by a UUID
    db: Session = Depends(database.get_db),  # Database session dependency
):
    """
    Fetch all companies that belong to a specific collection.
    """
    # Query the database to fetch companies that belong to the specified collection
    companies = (
        db.query(database.Company)
        .join(database.CompanyCollectionAssociation)  # Assuming there's an association table
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
        .all()
    )

    # If the collection does not exist or has no companies, raise an exception
    if not companies:
        raise HTTPException(status_code=404, detail="No companies found for this collection.")

    # Map the results to the CompanyOutput format
    company_outputs = [
        CompanyOutput(
            id=company.id,
            company_name=company.company_name,
            liked=False  # Set the 'liked' status to False (or modify based on your logic)
        )
        for company in companies
    ]

    # Return the batch of companies and the total count
    return CompanyBatchOutput(
        companies=company_outputs,
        total=len(company_outputs)
    )