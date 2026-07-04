import pandas as pd

FAQ_PATH = "noor_faq_knowledge_base.csv"
QUERIES_PATH = "noor_synthetic_queries.csv"

EXPECTED_FAQ_COLS = ["faq_id", "category", "question_en", "answer_en", "payment_method", "keywords"]
EXPECTED_QUERY_COLS = [
    "query_id", "raw_query", "query_language", "normalized_query_en", "intent",
    "faq_id", "payment_method", "sentiment", "channel", "user_persona",
    "contains_typo", "timestamp",
]
EXPECTED_CATEGORIES = {
    "account_verification", "transaction_status", "refunds", "top_up_failure",
    "kyc_cnic", "login_security", "fees_limits", "fraud_report",
    "agent_escalation", "app_technical",
}
EXPECTED_LANGUAGES = {"roman_urdu", "english", "code_switched"}
EXPECTED_SENTIMENTS = {"neutral", "frustrated", "confused", "urgent", "satisfied"}
EXPECTED_CHANNELS = {"in_app_chat", "whatsapp", "ivr_transcript"}
EXPECTED_PERSONAS = {"student", "salaried", "freelancer", "small_business_owner", "senior_citizen"}
EXPECTED_PAYMENT_METHODS = {"EasyPaisa", "JazzCash", "Bank Transfer", "Debit Card", "N/A"}


def section(title):
    print(f"\n{'=' * 60}\n{title}\n{'=' * 60}")


def check_columns(df, expected, name):
    missing = set(expected) - set(df.columns)
    extra = set(df.columns) - set(expected)
    print(f"[{name}] columns match: {not missing and not extra}")
    if missing:
        print(f"  MISSING: {missing}")
    if extra:
        print(f"  EXTRA: {extra}")


def check_nulls(df, name):
    nulls = df.isnull().sum()
    nulls = nulls[nulls > 0]
    print(f"[{name}] null counts:\n{nulls if not nulls.empty else '  none'}")


def check_dupes(df, id_col, name):
    dupes = df[id_col].duplicated().sum()
    print(f"[{name}] duplicate {id_col}: {dupes}")


def check_enum(df, col, expected_set, name):
    actual = set(df[col].dropna().unique())
    unexpected = actual - expected_set
    print(f"[{name}] unexpected {col} values: {unexpected if unexpected else 'none'}")


faq = pd.read_csv(FAQ_PATH)
queries = pd.read_csv(QUERIES_PATH)

section("ROW COUNTS")
print(f"FAQ rows: {len(faq)}")
print(f"Queries rows: {len(queries)}")

section("COLUMN CHECK")
check_columns(faq, EXPECTED_FAQ_COLS, "FAQ")
check_columns(queries, EXPECTED_QUERY_COLS, "Queries")

section("DUPLICATE IDS")
check_dupes(faq, "faq_id", "FAQ")
check_dupes(queries, "query_id", "Queries")

section("NULL CHECK")
check_nulls(faq, "FAQ")
check_nulls(queries, "Queries")

section("FAQ CATEGORY BALANCE")
print(faq["category"].value_counts())

section("QUERIES INTENT BALANCE")
print(queries["intent"].value_counts())

section("ENUM VALIDATION")
check_enum(faq, "category", EXPECTED_CATEGORIES, "FAQ")
check_enum(faq, "payment_method", EXPECTED_PAYMENT_METHODS, "FAQ")
check_enum(queries, "intent", EXPECTED_CATEGORIES, "Queries")
check_enum(queries, "query_language", EXPECTED_LANGUAGES, "Queries")
check_enum(queries, "sentiment", EXPECTED_SENTIMENTS, "Queries")
check_enum(queries, "channel", EXPECTED_CHANNELS, "Queries")
check_enum(queries, "user_persona", EXPECTED_PERSONAS, "Queries")
check_enum(queries, "payment_method", EXPECTED_PAYMENT_METHODS, "Queries")

section("FOREIGN KEY INTEGRITY (queries.faq_id -> faq.faq_id)")
valid_ids = set(faq["faq_id"])
query_ids = set(queries["faq_id"])
orphans = query_ids - valid_ids
print(f"Distinct faq_id referenced in queries: {len(query_ids)} / {len(valid_ids)} total FAQ ids")
print(f"Orphaned faq_id references: {len(orphans)}")
if orphans:
    print(f"  Examples: {list(orphans)[:10]}")

section("INTENT vs FAQ CATEGORY CONSISTENCY")
merged = queries.merge(faq[["faq_id", "category"]], on="faq_id", how="left", suffixes=("", "_faq"))
mismatches = merged[merged["intent"] != merged["category"]]
print(f"Rows where queries.intent != faq.category: {len(mismatches)}")
if len(mismatches) > 0:
    print(mismatches[["query_id", "faq_id", "intent", "category"]].head(10))

section("QUERY LANGUAGE DISTRIBUTION")
print(queries["query_language"].value_counts(normalize=True).round(3))

section("TYPO FLAG DISTRIBUTION")
print(queries["contains_typo"].value_counts(normalize=True).round(3))

section("DUPLICATE raw_query CHECK")
dupe_raw = queries["raw_query"].duplicated().sum()
print(f"Exact duplicate raw_query rows: {dupe_raw}")

section("SAMPLE ROWS")
print("\n--- FAQ sample ---")
print(faq.sample(min(3, len(faq)), random_state=1).to_string())
print("\n--- Queries sample ---")
print(queries.sample(min(5, len(queries)), random_state=1).to_string())
