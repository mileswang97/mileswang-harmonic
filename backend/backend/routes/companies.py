from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.db import database

router = APIRouter(
    prefix="/companies",
    tags=["companies"],
)


class CompanyOutput(BaseModel):
    id: int
    company_name: str
    liked: bool


class CompanyBatchOutput(BaseModel):
    companies: list[CompanyOutput]
    total: int


def fetch_companies_with_liked(
    db: Session, company_ids: list[int]
) -> list[CompanyOutput]:
    liked_list = (
        db.query(database.CompanyCollection)
        .filter(database.CompanyCollection.collection_name == "Liked Companies List")
        .first()
    )

    liked_associations = (
        db.query(database.CompanyCollectionAssociation)
        .filter(database.Company.id.in_(company_ids))
        .filter(
            database.CompanyCollectionAssociation.collection_id == liked_list.id,
        )
        .all()
    )

    liked_companies = {association.company_id for association in liked_associations}

    companies = (
        db.query(database.Company).filter(database.Company.id.in_(company_ids)).all()
    )

    results = [(company, company.id in liked_companies) for company in companies]

    return [
        CompanyOutput(
            id=company.id,
            company_name=company.company_name,
            liked=True if liked else False,
        )
        for company, liked in results
    ]


@router.get("", response_model=CompanyBatchOutput)
def get_companies(
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    results = db.query(database.Company).offset(offset).limit(limit).all()

    count = db.query(database.Company).count()
    companies = fetch_companies_with_liked(db, [company.id for company in results])

    return CompanyBatchOutput(
        companies=companies,
        total=count,
    )


@router.post("/{company_id}/add-to-collection")
async def add_company_to_collection(
    company_id: int,
    collection_name: str = "Liked Companies List",  # Defaults to "Liked Companies List"
    db: Session = Depends(database.get_db),
):
    """
    Add a company to a specified collection.
    By default, it adds the company to "Liked Companies List".
    """
    # Fetch the collection by name
    target_collection = (
        db.query(database.CompanyCollection)
        .filter(database.CompanyCollection.collection_name == collection_name)
        .first()
    )

    if not target_collection:
        raise HTTPException(status_code=404, detail="Target collection not found")

    # Check if the company already exists in the collection
    existing_association = (
        db.query(database.CompanyCollectionAssociation)
        .filter_by(company_id=company_id, collection_id=target_collection.id)
        .first()
    )

    if existing_association:
        raise HTTPException(status_code=400, detail="Company already in collection")

    # Create a new association
    new_association = database.CompanyCollectionAssociation(
        company_id=company_id, collection_id=target_collection.id
    )
    db.add(new_association)
    db.commit()

    return {"message": "Company added to collection"}