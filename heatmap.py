import matplotlib.pyplot as plt
import pandas as pd
for i in range(1,11):
        missdata=[]
        with open("acttestdata"+str(i)+".txt","r")as fp:
            data = fp.readlines()
            for line in data:
                if "cache-misses" in line:
                    arr = line.split()
                    if "cache-misses:" == arr[6]:
                        i = 7
                    else:
                        i = 6
                    missdata.append(arr[i])
        misscount=[]
        for i in missdata:
            misscount.append(missdata.count(i))
        df1 = pd.DataFrame(misscount, columns=['count'], index = missdata)
        plt.imshow(df1, cmap="YlGn")
        plt.colorbar()
        plt.xticks(range(1),rotation=20)
        plt.yticks(range(40), df1.index)
        plt.show()

        plt.scatter(misscount, missdata, s=1)
        plt.xticks([])
        plt.yticks([])
        plt.xlabel("Misses")
        plt.ylabel("Address")
        #plt.autoscale(True, 'both', True)
        plt.rcParams["figure.figsize"]=[100,100]
        plt.show()
