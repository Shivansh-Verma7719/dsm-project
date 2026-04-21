from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "data"
CENSUS_CSV = DATA_DIR / "census" / "district_census_consolidated.csv"
PCA_XLSX = DATA_DIR / "census" / "DDW_PCA0000_2011_Indiastatedist.xlsx"
C08_XLSX = DATA_DIR / "census" / "DDW-0000C-08.xlsx"
NSE_CSV = DATA_DIR / "state_investors_nse.csv"
NSDP_CSV = DATA_DIR / "state_per_capita_nsdp_2011.csv"
OUT_CSV = DATA_DIR / "state_layer.csv"

# Fallback for UTs that don't publish SDP estimates (Daman & Diu, Dadra & NH, Lakshadweep)
NSDP_FALLBACK = {25: 229064, 26: 159002, 31: 79696}

STATE_NAMES = {
    1: "Jammu & Kashmir", 2: "Himachal Pradesh", 3: "Punjab",
    4: "Chandigarh", 5: "Uttarakhand", 6: "Haryana", 7: "Delhi",
    8: "Rajasthan", 9: "Uttar Pradesh", 10: "Bihar", 11: "Sikkim",
    12: "Arunachal Pradesh", 13: "Nagaland", 14: "Manipur", 15: "Mizoram",
    16: "Tripura", 17: "Meghalaya", 18: "Assam", 19: "West Bengal",
    20: "Jharkhand", 21: "Odisha", 22: "Chhattisgarh", 23: "Madhya Pradesh",
    24: "Gujarat", 25: "Daman & Diu", 26: "Dadra & Nagar Haveli",
    27: "Maharashtra", 28: "Andhra Pradesh", 29: "Karnataka", 30: "Goa",
    31: "Lakshadweep", 32: "Kerala", 33: "Tamil Nadu", 34: "Puducherry",
    35: "Andaman & Nicobar",
}

NSE_NAME_MAP = {
    "ANDAMAN & NICOBAR ISLANDS":  35,
    "ANDHRA PRADESH":             28,
    "ARUNACHAL PRADESH":          12,
    "ASSAM":                      18,
    "BIHAR":                      10,
    "CHANDIGARH":                  4,
    "CHHATTISGARH":               22,
    "DADRA & NAGAR HAVELI":       26,
    "DAMAN & DIU":                25,
    "DELHI":                       7,
    "GOA":                        30,
    "GUJARAT":                    24,
    "HARYANA":                     6,
    "HIMACHAL PRADESH":            2,
    "JAMMU & KASHMIR":             1,
    "JHARKHAND":                  20,
    "KARNATAKA":                  29,
    "KERALA":                     32,
    "LADAKH":                      1,
    "LAKHSWADEEP":                31,
    "MADHYA PRADESH":             23,
    "MAHARASHTRA":                27,
    "MANIPUR":                    14,
    "MEGHALAYA":                  17,
    "MIZORAM":                    15,
    "NAGALAND":                   13,
    "ORISSA":                     21,
    "PONDICHERRY":                34,
    "PUNJAB":                      3,
    "RAJASTHAN":                   8,
    "SIKKIM":                     11,
    "TAMIL NADU":                 33,
    "TELANGANA":                  28,
    "TRIPURA":                    16,
    "UTTAR PRADESH":               9,
    "UTTARAKHAND":                 5,
    "WEST BENGAL":                19,
}


def build_c08_table(path: Path) -> pd.DataFrame:
    raw = pd.read_excel(path, header=None)
    states = raw[(raw[2] == "000") & (raw[4] == "Total") & (raw[5] == "All ages")].copy()
    states = states[[1, 6, 9, 39]].copy()
    states.columns = ["state_code", "total_pop_7plus", "illiterate", "graduate_above_2011"]
    for col in ["total_pop_7plus", "illiterate", "graduate_above_2011"]:
        states[col] = pd.to_numeric(states[col], errors="coerce")
    states["state_code"] = pd.to_numeric(states["state_code"], errors="coerce").astype(int)
    return states[["state_code", "graduate_above_2011"]]


def build_pca_table(path: Path) -> pd.DataFrame:
    raw = pd.read_excel(path, header=0)
    states = raw[(raw["Level"] == "STATE") & (raw["TRU"] == "Total")].copy()
    states = states.rename(columns={"State": "state_code"})
    states["literate_persons_2011"] = states["P_LIT"].astype(int)
    states["total_workers_2011"] = states["TOT_WORK_P"].astype(int)
    return states[["state_code", "literate_persons_2011", "total_workers_2011"]]


def build_nse_table(path: Path) -> pd.DataFrame:
    nse = pd.read_csv(path)
    nse["state_code"] = nse["state_raw"].map(NSE_NAME_MAP)
    nse = nse.dropna(subset=["state_code"])
    nse["state_code"] = nse["state_code"].astype(int)
    return (
        nse.groupby("state_code")
        .agg(
            total_ucc=("total_ucc", "sum"),
            investors_last_year=("last_year", "sum"),
            investors_last_5yr=("last_5_years", "sum"),
        )
        .reset_index()
        .assign(investors_pre_2021=lambda d: d["total_ucc"] - d["investors_last_5yr"])
    )


def build() -> None:
    census = pd.read_csv(CENSUS_CSV, low_memory=False)

    agg = (
        census.groupby("state_code")
        .agg(
            total_population=("persons_2011", "sum"),
            total_households=("households_2011", "sum"),
            urban_population=("urban_pop_2011", "sum"),
            rural_population=("rural_pop_2011", "sum"),
            area_sqkm=("area_sqkm", "sum"),
            total_towns=("towns", "sum"),
            total_villages=("villages_inhabited", "sum"),
            n_districts=("district_name", "count"),
            permanent_house=("permanent_house_2001", "sum"),
            semi_permanent_house=("semi_permanent_house_2001", "sum"),
            temporary_house=("temporary_house_2001", "sum"),
            graduate_and_above=("graduate_and_above_2001", "sum"),
            total_educated=("total_educated_2001", "sum"),
        )
        .reset_index()
    )

    agg["pop_per_sqkm"] = (agg["total_population"] / agg["area_sqkm"]).round(1)
    agg = agg.rename(columns={"permanent_house": "permanent_houses_2001"})

    pca = build_pca_table(PCA_XLSX)
    c08 = build_c08_table(C08_XLSX)
    nse = build_nse_table(NSE_CSV)

    nsdp = pd.read_csv(NSDP_CSV)
    fallback_rows = pd.DataFrame([
        {"state_code": code, "per_capita_income_2011": val}
        for code, val in NSDP_FALLBACK.items()
    ])
    nsdp = pd.concat([nsdp[["state_code", "per_capita_income_2011"]], fallback_rows], ignore_index=True)

    meta_df = pd.DataFrame([
        {"state_code": code, "state_name": name}
        for code, name in STATE_NAMES.items()
    ])

    state = agg.merge(pca, on="state_code", how="left")
    state = state.merge(c08, on="state_code", how="left")
    state = state.merge(meta_df, on="state_code", how="left")
    state = state.merge(nsdp, on="state_code", how="left")
    state = state.merge(nse, on="state_code", how="left")

    state["investors_per_lakh"] = (
        state["total_ucc"] / state["total_population"] * 100_000
    ).round(1)

    final_cols = [
        "state_code", "state_name",
        "total_population", "total_households", "n_districts",
        "urban_population", "rural_population",
        "area_sqkm", "pop_per_sqkm",
        "total_towns", "total_villages",
        "literate_persons_2011",
        "total_workers_2011",
        "graduate_above_2011",
        "permanent_houses_2001",
        "per_capita_income_2011",
        "total_ucc", "investors_last_year", "investors_last_5yr",
        "investors_pre_2021", "investors_per_lakh",
    ]
    state = state[final_cols]
    state.to_csv(OUT_CSV, index=False)

    print(f"Written: {OUT_CSV} ({len(state)} rows x {len(state.columns)} cols)")
    print()
    print(state[["state_name", "literate_persons_2011", "total_workers_2011",
                 "graduate_above_2011", "per_capita_income_2011",
                 "investors_per_lakh"]].to_string(index=False))


if __name__ == "__main__":
    build()
