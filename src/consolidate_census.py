import re
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "data" / "census"
OUT_DIR = Path(__file__).parent.parent / "data" / "census"

PINCODE_CSV = DATA_DIR / "consolidated_pincode_census.csv"
A1_XLSX = DATA_DIR / "A-1_NO_OF_VILLAGES_TOWNS_HOUSEHOLDS_POPULATION_AND_AREA.xlsx"


def normalize_name(name: str) -> str:
    name = str(name).lower().strip()
    name = re.sub(r"[^a-z0-9]", "", name)
    replacements = {
        "ahmadabad": "ahmedabad",
        "ahmadnagar": "ahmednagar",
        "anantapur": "ananthapur",
        "anantnag": "ananthnag",
        "baleshwar": "baleswar",
        "banaskantha": "banaskantha",
        "baudh": "boudh",
        "bijapur": "bijapur",
        "east champaran": "eastchamparan",
        "eastchamparan": "eastchamparan",
        "westchamparan": "westchamparan",
        "khordha": "khurda",
        "nabarangapur": "nabarangpur",
        "pashchim medinipur": "paschimmedinipur",
        "purba medinipur": "purbamedinipur",
        "ribhoi": "ri bhoi",
        "sahibzadaajitsinghnagar": "sahibzadaajitsinghnagarmohalimohali",
        "mohali": "sahibzadaajitsinghnagarmohalimohali",
        "sas nagar": "sahibzadaajitsinghnagarmohalimohali",
    }
    return replacements.get(name, name)


def build_a1_district_table() -> pd.DataFrame:
    raw = pd.read_excel(A1_XLSX, header=None)

    total_rows = raw[raw[3] == "DISTRICT"].copy()
    total = total_rows[total_rows[5] == "Total"].copy()
    rural = total_rows[total_rows[5] == "Rural"][[0, 1, 4, 10, 9]].copy()
    urban = total_rows[total_rows[5] == "Urban"][[0, 1, 4, 10, 9]].copy()

    total.columns = [
        "state_code", "district_code", "subdist_code", "level", "district_name",
        "total_rural_urban", "villages_inhabited", "villages_uninhabited",
        "towns", "households_2011", "persons_2011", "males_2011", "females_2011",
        "area_sqkm", "pop_per_sqkm",
    ]
    rural.columns = ["state_code", "district_code", "district_name", "rural_pop_2011", "rural_hh_2011"]
    urban.columns = ["state_code", "district_code", "district_name", "urban_pop_2011", "urban_hh_2011"]

    base = total[[
        "state_code", "district_code", "district_name",
        "villages_inhabited", "villages_uninhabited", "towns",
        "households_2011", "persons_2011", "males_2011", "females_2011",
        "area_sqkm", "pop_per_sqkm",
    ]].copy()

    base = base.merge(
        rural[["state_code", "district_code", "rural_pop_2011", "rural_hh_2011"]],
        on=["state_code", "district_code"], how="left"
    )
    base = base.merge(
        urban[["state_code", "district_code", "urban_pop_2011", "urban_hh_2011"]],
        on=["state_code", "district_code"], how="left"
    )

    base["urban_pct_2011"] = (base["urban_pop_2011"] / base["persons_2011"] * 100).round(2)
    base["district_key"] = base["district_name"].apply(normalize_name)
    return base.reset_index(drop=True)


def build_pincode_table() -> tuple[pd.DataFrame, pd.DataFrame]:
    raw = pd.read_csv(PINCODE_CSV, low_memory=False)
    raw.drop(columns=["Unnamed: 0"], errors="ignore", inplace=True)

    raw.columns = [
        c.replace(".", "_").replace(" ", "_").lower()
        .replace("(uom:%(percentage)),_scaling_factor:1", "")
        .replace("(uom:number),_scaling_factor:1", "")
        .strip("_")
        for c in raw.columns
    ]

    raw["district_key"] = raw["district_key"].apply(normalize_name)

    # Pincode mapping (all pincodes per district)
    pin_map = (
        raw.groupby("district_key")["pincode"]
        .apply(lambda x: sorted(x.dropna().astype(int).unique().tolist()))
        .reset_index()
        .rename(columns={"pincode": "pincodes"})
    )

    # District-level 2001 indicators (deduplicate to one row per district)
    indicator_cols = [
        "district_key", "district",
        "persons", "males", "females",
        "growth__1991___2001_",
        "rural", "number_of_households",
        "household_size__per_household_",
        "sex_ratio__females_per_1000_males_",
        "scheduled_caste_population",
        "scheduled_tribe_population",
        "persons__literate", "persons__literacy_rate",
        "males__literatacy_rate", "females__literacy_rate",
        "total_educated", "below_primary", "primary", "middle",
        "matric_higher_secondary_diploma", "graduate_and_above",
        "x0___4_years", "x5___14_years", "x15___59_years",
        "x60_years_and_above__incl__a_n_s__",
        "total_workers", "main_workers", "marginal_workers", "non_workers",
        "total_inhabited_villages",
        "drinking_water_facilities", "safe_drinking_water",
        "electricity__power_supply_", "primary_school", "middle_schools",
        "secondary_sr__secondary_schools", "college",
        "medical_facility", "primary_health_centre",
        "bus_services", "paved_approach_road",
        "permanent_house", "semi_permanent_house", "temporary_house",
    ]
    available = [c for c in indicator_cols if c in raw.columns]
    district_indicators = (
        raw[available]
        .groupby("district_key")
        .first()
        .reset_index()
    )
    district_indicators.columns = [
        c if c in ("district_key", "district") else f"{c}_2001"
        for c in district_indicators.columns
    ]

    return district_indicators, pin_map


def consolidate() -> None:
    print("Building 2011 district table from A-1 xlsx...")
    a1 = build_a1_district_table()
    print(f"  {len(a1)} districts")

    print("Building 2001 indicator table and pincode map from pincode CSV...")
    indicators, pin_map = build_pincode_table()
    print(f"  {len(indicators)} districts | {len(pin_map)} pincode entries")

    print("Merging on district_key...")
    merged = a1.merge(indicators, on="district_key", how="left")
    merged = merged.merge(pin_map, on="district_key", how="left")

    matched = merged["persons_2001"].notna().sum()
    print(f"  Matched 2001 indicators: {matched} / {len(merged)} districts")

    # Clean column order
    id_cols = ["state_code", "district_code", "district_name", "district_key"]
    cols_2011 = [c for c in merged.columns if "2011" in c]
    cols_2001 = [c for c in merged.columns if "2001" in c]
    other = [c for c in merged.columns if c not in id_cols + cols_2011 + cols_2001 + ["pincodes", "district"]]
    final_order = id_cols + cols_2011 + cols_2001 + other + ["pincodes"]
    final_order = [c for c in final_order if c in merged.columns]
    merged = merged[final_order]

    out_path = OUT_DIR / "district_census_consolidated.csv"
    merged.to_csv(out_path, index=False)
    print(f"\nWritten: {out_path} ({len(merged)} rows, {len(merged.columns)} columns)")

    # Also write a lean pincode -> district lookup
    pin_lookup = pin_map.copy()
    pin_lookup = pin_lookup.merge(
        a1[["district_key", "district_name", "state_code"]],
        on="district_key", how="left"
    )
    # Explode so each row = one pincode
    pin_exploded = pin_lookup.explode("pincodes").rename(columns={"pincodes": "pincode"})
    pin_exploded = pin_exploded.dropna(subset=["pincode"]).reset_index(drop=True)
    pin_out = OUT_DIR / "pincode_district_lookup.csv"
    pin_exploded.to_csv(pin_out, index=False)
    print(f"Written: {pin_out} ({len(pin_exploded)} rows)")


if __name__ == "__main__":
    consolidate()
