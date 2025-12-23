import json
import csv

INPUT_JSON = "2425.json"
OUTPUT_CSV = "2425.csv"

with open(INPUT_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

# Collect all possible field names
fieldnames = set()
for item in data:
    fieldnames.update(item.keys())

fieldnames = sorted(fieldnames)

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()

    for item in data:
        row = item.copy()

        # Flatten COLORS array -> comma-separated string
        if isinstance(row.get("COLORS"), list):
            row["COLORS"] = ", ".join(row["COLORS"])

        writer.writerow(row)

print(f"CSV written to {OUTPUT_CSV}")