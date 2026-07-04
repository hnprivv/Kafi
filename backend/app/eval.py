"""Scores retrieval accuracy against noor_synthetic_queries.csv ground truth.

Two modes, because the pipeline has two independent failure points and a
single end-to-end score can't tell them apart:

  full            Real production pipeline: LLM normalizes the raw
                   code-switched query, then retrieves. This is what a user
                   actually experiences, but costs one chat-model call per
                   row. Defaults to a stratified sample (~25/category) sized
                   to the chat model's daily quota.

  retrieval_only  Skips the LLM normalization call and retrieves directly
                   using the dataset's ground-truth normalized_query_en.
                   Isolates whether the embedding retrieval itself is sound,
                   independent of translation quality. Embeddings run locally
                   (fastembed), so this mode costs nothing, needs no rate
                   limiting, and defaults to the full dataset.

Usage:
    python -m app.eval --mode retrieval_only
    python -m app.eval --mode full
    python -m app.eval --mode full --sample 100 --workers 2
"""

import argparse
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd

from app.pipeline import KafiPipeline, normalize_query, retrieve_faqs

QUERIES_CSV_PATH = "../data/noor_synthetic_queries.csv"
RESULTS_CSV_PATH = "../data/eval_results.csv"

# Full mode is paced by the chat model's free-tier quota (Gemini 3.1 Flash
# Lite: 15 RPM / 500 RPD). Embeddings are local, so retrieval_only has no cap.
FULL_MODE_DEFAULT_SAMPLE = 250
FULL_MODE_SAFE_RPM = 12


class RateLimiter:
    """Paces calls to a fixed rate, shared across threads. Thread count alone
    doesn't guarantee request timing stays under an RPM cap - this does."""

    def __init__(self, rpm: int) -> None:
        self.min_interval = 60.0 / rpm
        self.lock = threading.Lock()
        self.next_allowed = time.monotonic()

    def acquire(self) -> None:
        with self.lock:
            now = time.monotonic()
            wait = self.next_allowed - now
            if wait > 0:
                time.sleep(wait)
                now = time.monotonic()
            self.next_allowed = now + self.min_interval


def stratified_sample(df: pd.DataFrame, n: int, stratify_col: str = "intent") -> pd.DataFrame:
    if n >= len(df):
        return df
    per_group = max(1, n // df[stratify_col].nunique())
    sampled = df.groupby(stratify_col, group_keys=False).sample(n=per_group, random_state=42)
    return sampled.reset_index(drop=True)


def score_row(pipeline: KafiPipeline, row: pd.Series, mode: str, limiter: RateLimiter | None, k: int = 3) -> dict:
    try:
        if mode == "full":
            limiter.acquire()
            normalized = normalize_query(pipeline.chat_model, row["raw_query"])
        else:
            normalized = row["normalized_query_en"]

        docs = retrieve_faqs(pipeline.vectorstore, normalized, k=k)
        retrieved_ids = [doc.metadata["faq_id"] for doc in docs]
        retrieved_categories = [doc.metadata["category"] for doc in docs]

        return {
            "query_id": row["query_id"],
            "true_faq_id": row["faq_id"],
            "intent": row["intent"],
            "query_language": row["query_language"],
            "contains_typo": row["contains_typo"],
            "normalized_query_used": normalized,
            "normalized_query_ground_truth": row["normalized_query_en"],
            "retrieved_faq_ids": ";".join(retrieved_ids),
            "top1_correct": retrieved_ids[0] == row["faq_id"] if retrieved_ids else False,
            "top3_correct": row["faq_id"] in retrieved_ids,
            "category_correct": retrieved_categories[0] == row["intent"] if retrieved_categories else False,
            "error": "",
        }
    except Exception as exc:  # noqa: BLE001 - log and continue, one bad row shouldn't kill the run
        return {
            "query_id": row["query_id"],
            "true_faq_id": row["faq_id"],
            "intent": row["intent"],
            "query_language": row["query_language"],
            "contains_typo": row["contains_typo"],
            "normalized_query_used": "",
            "normalized_query_ground_truth": row["normalized_query_en"],
            "retrieved_faq_ids": "",
            "top1_correct": False,
            "top3_correct": False,
            "category_correct": False,
            "error": str(exc),
        }


def run_eval(mode: str, sample: int | None, workers: int) -> pd.DataFrame:
    queries = pd.read_csv(QUERIES_CSV_PATH)

    if sample is None:
        sample = FULL_MODE_DEFAULT_SAMPLE if mode == "full" else len(queries)
    queries = stratified_sample(queries, sample)

    limiter = RateLimiter(FULL_MODE_SAFE_RPM) if mode == "full" else None

    pipeline = KafiPipeline()
    results = []

    start = time.time()
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(score_row, pipeline, row, mode, limiter): row["query_id"]
            for _, row in queries.iterrows()
        }
        done = 0
        for future in as_completed(futures):
            results.append(future.result())
            done += 1
            if done % 50 == 0 or done == len(futures):
                elapsed = time.time() - start
                print(f"  {done}/{len(futures)} rows scored ({elapsed:.0f}s elapsed)")

    return pd.DataFrame(results)


def print_summary(df: pd.DataFrame) -> None:
    errors = df[df["error"] != ""]
    scored = df[df["error"] == ""]

    print("\n" + "=" * 60)
    print("OVERALL")
    print("=" * 60)
    print(f"Rows scored: {len(scored)}  |  Errors: {len(errors)}")
    print(f"Top-1 accuracy:      {scored['top1_correct'].mean():.1%}")
    print(f"Top-3 accuracy:      {scored['top3_correct'].mean():.1%}")
    print(f"Category accuracy:   {scored['category_correct'].mean():.1%}")

    print("\n" + "=" * 60)
    print("BY QUERY LANGUAGE")
    print("=" * 60)
    print(scored.groupby("query_language")[["top1_correct", "top3_correct", "category_correct"]].mean().round(3))

    print("\n" + "=" * 60)
    print("BY TYPO FLAG")
    print("=" * 60)
    print(scored.groupby("contains_typo")[["top1_correct", "top3_correct", "category_correct"]].mean().round(3))

    print("\n" + "=" * 60)
    print("BY INTENT (worst 5)")
    print("=" * 60)
    by_intent = scored.groupby("intent")["top1_correct"].mean().sort_values()
    print(by_intent.head(5).round(3))

    if len(errors) > 0:
        print("\n" + "=" * 60)
        print(f"ERRORS ({len(errors)} rows) - sample")
        print("=" * 60)
        print(errors[["query_id", "error"]].head(10).to_string())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["full", "retrieval_only"], default="retrieval_only")
    parser.add_argument("--sample", type=int, default=None, help="Override the mode's default sample size")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent threads (rate limiter still paces actual calls)")
    args = parser.parse_args()

    results_df = run_eval(mode=args.mode, sample=args.sample, workers=args.workers)
    suffix = args.mode
    out_path = RESULTS_CSV_PATH.replace(".csv", f"_{suffix}.csv")
    results_df.to_csv(out_path, index=False)
    print(f"\nSaved detailed results to {out_path}")
    print_summary(results_df)
