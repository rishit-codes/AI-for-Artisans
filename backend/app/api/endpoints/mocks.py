from fastapi import APIRouter, Depends, Response
from typing import Any, List

router = APIRouter()

@router.get("/trends")
async def get_mock_trends() -> Any:
    return [
        { "id": 1, "title": "Pastel Phulkari", "category": "Embroidery", "interest_score": 87, "tags": ["floral", "pastel", "Punjab"], "description": "Soft pastel tones replacing traditional bright Phulkari — high demand in urban gifting segment." },
        { "id": 2, "title": "Geometric Dhurrie", "category": "Weaving", "interest_score": 74, "tags": ["geometric", "minimal", "home-decor"], "description": "Clean geometric motifs on flat-woven dhurries trending in home décor e-commerce." },
        { "id": 3, "title": "Indigo Block Print", "category": "Printing", "interest_score": 91, "tags": ["indigo", "block-print", "sustainable"], "description": "Natural indigo block prints seeing a surge driven by sustainability-conscious buyers." },
        { "id": 4, "title": "Madhubani on Fabric", "category": "Painting", "interest_score": 68, "tags": ["madhubani", "Bihar", "cultural"], "description": "Traditional Madhubani motifs applied to sarees and stoles — popular in craft exhibitions." },
        { "id": 5, "title": "Kantha Stitch Quilts", "category": "Embroidery", "interest_score": 82, "tags": ["kantha", "Bengal", "quilts"], "description": "Running stitch Kantha quilts trending in international artisan marketplaces." },
        { "id": 6, "title": "Warli on Tote Bags", "category": "Painting", "interest_score": 79, "tags": ["warli", "tribal", "accessories"], "description": "Warli tribal art applied to everyday accessories bridging traditional and modern markets." }
    ]

@router.get("/materials/prices")
async def get_mock_materials_prices(response: Response) -> Any:
    response.headers["X-Data-Source"] = "mock"
    return [
        { "material": "Cotton Yarn", "unit": "per kg", "price_per_unit": 320, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Natural Indigo Dye", "unit": "per 100g", "price_per_unit": 180, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Silk Thread", "unit": "per 50g", "price_per_unit": 240, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Wool (Merino)", "unit": "per kg", "price_per_unit": 890, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Raw Linen", "unit": "per metre", "price_per_unit": 145, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Madder Root Dye", "unit": "per 100g", "price_per_unit": 95, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Bamboo Fibre", "unit": "per kg", "price_per_unit": 410, "market": "Mandi", "last_updated": "2026-03-01" },
        { "material": "Zari Thread (Gold)", "unit": "per 10g", "price_per_unit": 320, "market": "Mandi", "last_updated": "2026-03-01" }
    ]
