import csv

input_file = "latestdata.csv"
output_file = "latestdata_trimmed.csv"

with open(input_file, "r") as source:
  reader = csv.reader(source)
  with open(output_file, "w", newline='') as result:
    writer = csv.writer(result)
    for count, row in enumerate(reader):
      if count % 499999 == 0:
          print(count)
      for col_index in range(32, 0, -1):
        if col_index not in [6, 7]:
          del row[col_index]
      writer.writerow(row)
