from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "data"
CENSUS_CSV = DATA_DIR / "census" / "district_census_consolidated.csv"
PCA_XLSX = DATA_DIR / "census" / "DDW_PCA0000_2011_Indiastatedist.xlsx"
C08_XLSX = DATA_DIR / "census" / "DDW-0000C-08.xlsx"
NSE_CSV = DATA_DIR / "state_investors_nse.csv"
OUT_CSV = DATA_DIR / "state_layer.csv"

# GSDP per capita 2011-12 at current prices (Rs), source: CSO/MoSPI
GSDP_PER_CAPITA = {
    1:  44923,   # Jammu & Kashmir
    2:  72752,   # Himachal Pradesh
    3:  78766,   # Punjab
    4:  130766,  # Chandigarh
    5:  68609,   # Uttarakhand
    6:  107127,  # Haryana
    7:  207054,  # Delhi
    8:  48433,   # Rajasthan
    9:  31087,   # Uttar Pradesh
    10: 22555,   # Bihar
    11: 141827,  # Sikkim
    12: 85921,   # Arunachal Pradesh
    13: 66929,   # Nagaland
    14: 36291,   # Manipur
    15: 70740,   # Mizoram
    16: 53422,   # Tripura
    17: 56296,   # Meghalaya
    18: 33195,   # Assam
    19: 56642,   # West Bengal
    20: 37891,   # Jharkhand
    21: 38219,   # Odisha
    22: 47768,   # Chhattisgarh
    23: 40754,   # Madhya Pradesh
    24: 100144,  # Gujarat
    25: 229064,  # Daman & Diu
    26: 159002,  # Dadra & Nagar Haveli
    27: 101576,  # Maharashtra
    28: 69440,   # Andhra Pradesh
    29: 82004,   # Karnataka
    30: 181858,  # Goa
    31: 79696,   # Lakshadweep
    32: 107441,  # Kerala
    33: 90824,   # Tamil Nadu
    34: 104373,  # Puducherry
    35: 79633,   # Andaman & Nicobar
}

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
    states.columns = ["state_code", "total_pop_7plus", "illiterate", "graduate_above"]
    for col in ["total_pop_7plus", "illiterate", "graduate_above"]:
        states[col] = pd.to_numeric(states[col], errors="coerce")
    states["state_code"] = pd.to_numeric(states["state_code"], errors="coerce").astype(int)
    states["literate_2011"] = states["total_pop_7plus"] - states["illiterate"]
    states["graduate_pct_2011"] = (states["graduate_above"] / states["literate_2011"] * 100).round(2)
    return states[["state_code", "graduate_pct_2011"]]


def build_pca_table(path: Path) -> pd.DataFrame:
    raw = pd.read_excel(path, header=0)
    states = raw[(raw["Level"] == "STATE") & (raw["TRU"] == "Total")].copy()
    states = states.rename(columns={"State": "state_code"})
    states["literacy_rate_2011"] = (states["P_LIT"] / states["TOT_P"] * 100).round(2)
    states["worker_participation_rate_2011"] = (states["TOT_WORK_P"] / states["TOT_P"] * 100).round(2)
    return states[["state_code", "literacy_rate_2011", "worker_participation_rate_2011"]]


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

    agg["urban_pct"] = (agg["urban_population"] / agg["total_population"] * 100).round(2)
    agg["pop_per_sqkm"] = (agg["total_population"] / agg["area_sqkm"]).round(1)
    agg["towns_per_lakh"] = (agg["total_towns"] / agg["total_population"] * 100_000).round(2)
    total_houses = agg["permanent_house"] + agg["semi_permanent_house"] + agg["temporary_house"]
    agg["permanent_house_pct"] = (agg["permanent_house"] / total_houses * 100).round(2)
    agg["graduate_pct_2001"] = (agg["graduate_and_above"] / agg["total_educated"] * 100).round(2)

    pca = build_pca_table(PCA_XLSX)
    c08 = build_c08_table(C08_XLSX)
    nse = build_nse_table(NSE_CSV)

    meta_df = pd.DataFrame([
        {"state_code": code, "state_name": name, "gsdp_per_capita_2011": gsdp}
        for code, name in STATE_NAMES.items()
        for gsdp in [GSDP_PER_CAPITA[code]]
    ])

    state = agg.merge(pca, on="state_code", how="left")
    state = state.merge(c08, on="state_code", how="left")
    state = state.merge(meta_df, on="state_code", how="left")
    state = state.merge(nse, on="state_code", how="left")

    state["investors_per_lakh"] = (
        state["total_ucc"] / state["total_population"] * 100_000
    ).round(1)

    final_cols = [
        "state_code", "state_name",
        "total_population", "total_households", "n_districts",
        "urban_population", "rural_population", "urban_pct",
        "area_sqkm", "pop_per_sqkm",
        "total_towns", "towns_per_lakh", "total_villages",
        "literacy_rate_2011",
        "worker_participation_rate_2011",
        "graduate_pct_2011",
        "permanent_house_pct",
        "gsdp_per_capita_2011",
        "total_ucc", "investors_last_year", "investors_last_5yr",
        "investors_pre_2021", "investors_per_lakh",
    ]
    state = state[final_cols]
    state.to_csv(OUT_CSV, index=False)

    print(f"Written: {OUT_CSV} ({len(state)} rows x {len(state.columns)} cols)")
    print()
    print(state[["state_name", "urban_pct", "literacy_rate_2011",
                 "worker_participation_rate_2011", "gsdp_per_capita_2011",
                 "investors_per_lakh"]].to_string(index=False))


if __name__ == "__main__":
    build()
