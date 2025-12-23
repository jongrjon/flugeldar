import csv
import json

INPUT_CSV = "2526.csv"
OUTPUT_JSON = "2526.json"

def parse_value(value):
    if value == "":
        return None
    if value == "#DIV/0!":
        return value
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value

data = []

with open(INPUT_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        item = {}

        for key, value in row.items():
            if key == "COLORS" and value:
                item[key] = [c.strip() for c in value.split(",")]
            else:
                item[key] = parse_value(value)

        data.append(item)

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"JSON written to {OUTPUT_JSON}")
