from fastapi import APIRouter, Depends, Response
from typing import Any, List

router = APIRouter()

@router.get("/trends")
async def get_mock_trends() -> Any:
    return [
        {
            "id": 1,
            "author": "Meera Textile Insights",
            "title": "Wedding Season Surge",
            "timestamp": "2 hours ago",
            "image_url": "/images/loom_weaving.png",
            "content": "Traditional Banarasi handlooms with festive reds, deep golds, and royal blues are seeing peak demand this wedding season. Weavers report a 40% surge in orders — lotus and peacock motifs in magenta-gold are the top request.",
            "tags": ["WeddingSilk", "FloralMotif"],
            "likes": "1.2k",
            "comments": 89,
            "performance_badge": "Top Performer",
            "niche": "Banarasi Silk"
        },
        {
            "id": 2,
            "author": "Arjun Dye Works",
            "title": "Sustainable Dyes Trending",
            "timestamp": "5 hours ago",
            "image_url": "/images/natural_dyes.png",
            "content": "Eco-conscious global buyers are actively sourcing naturally dyed cotton — indigo, turmeric, and madder red are the top picks. Market demand is up 25% this quarter, with premium pricing for certified natural dye products.",
            "tags": ["NaturalDyes", "IndigoRevival", "SustainableCraft"],
            "likes": "856",
            "comments": 42,
            "performance_badge": "Rising Trend",
            "niche": "Chikankari"
        },
        {
            "id": 3,
            "author": "Rajasthan Craft Hub",
            "title": "Cotton Block Prints",
            "timestamp": "1 day ago",
            "image_url": "/images/block_print.png",
            "content": "Sanganeri and Bagru block-printed kurtas and dupattas are surging in export orders — the US and EU markets alone have seen a 35% increase in demand for authentic hand-block prints this season.",
            "tags": ["BlockPrint", "SanganeriPrint", "RajasthanCraft", "Cotton"],
            "likes": "2.1k",
            "comments": 156,
            "performance_badge": "High Margin",
            "niche": "Kalamkari"
        }
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
