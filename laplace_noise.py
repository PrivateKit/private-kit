import pandas as pd
import numpy as np

def laplace_noise(delta_f, epsilon, shape):
    return np.random.laplace(0, delta_f/epsilon, shape)

# Load as histogram
data = pd.read_csv('./latestdata_trimmed.csv')
data = data.dropna()
print(data)
hist = pd.DataFrame(data.groupby(['latitude', 'longitude']).size())

print("*"*20)
print(hist)
hist_size = hist.shape[0]

# get noise
sensitivity = 1
epsilon = 0.1
size = hist_size

noise_vector = laplace_noise(sensitivity, epsilon, size)

# apply noise
hist[0] = hist[0] + noise_vector
hist.loc[hist[0] < 0] = 0
hist = hist.astype({0: 'int32'})
print("*"*20)
print(hist)

# go from histogram to full data
hist = hist.reset_index()
new_hist = pd.DataFrame(np.repeat(hist.values, hist[0].values, axis=0), columns=['latitude', 'longitude', 'count'])
new_hist = new_hist.drop(['count'], axis=1)
print("*"*20)
print(new_hist)

# save it as a file
new_hist.to_csv('./noised_data.csv')
