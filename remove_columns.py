import csv

input_file = "latestdata.csv"
output_file = "latestdata_trimmed.csv"

with open(input_file, "r") as source:
  reader = csv.reader(source)
  with open(output_file, "w", newline='') as result:
    writer = csv.writer(result)
    for row in reader:
      for col_index in range(33, 0, -1):
        if col_index not in [7, 8]:
          del row[col_index]
      writer.writerow(row)
