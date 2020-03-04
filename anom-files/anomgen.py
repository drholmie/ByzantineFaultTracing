import matplotlib.pyplot as plt
import base64
missdata=[]
with open("anomautoacttestdata.txt","r")as fp:
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
plt.scatter(misscount, missdata, s=1)
plt.xticks([])
plt.yticks([])
plt.xlabel("Misses")
plt.ylabel("Address")
plt.savefig("anomautotestimg.png")
print(base64.b64encode(open('anomautotestimg.png','rb').read()))
