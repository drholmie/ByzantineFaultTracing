from os import listdir
from os.path import isfile, join
import random
def get_black_pixels(image):
    black_and_white_version = image.convert('1')
    black_pixels = black_and_white_version.histogram()[0]
    return black_pixels

def distance_calc(current, expected):
    """Checks if both images are similar enough to be considered equal.
    Similarity is controlled by the ```diff_tolerance``` argument."""
    from PIL import Image, ImageChops

    if isinstance(current, str):
        current = Image.open(current)
    if isinstance(expected, str):
        expected = Image.open(expected)

    diff = ImageChops.difference(expected, current)
    black_pixels = get_black_pixels(diff)
    total_pixels = diff.size[0] * diff.size[1]
    similarity_ratio = black_pixels / total_pixels
    return similarity_ratio

def image_distance(example, cluster):
    '''Calculates distance between image and cluster'''
    mynormpath = "../newdatafiles"
    myanompath = "../newanomdatafiles"
    onlynormfiles = [f for f in listdir(mynormpath) if isfile(join(mynormpath, f))]
    onlyanomfiles = [f for f in listdir(myanompath) if isfile(join(myanompath, f))]
    norm_arr = []
    anom_arr = []
    if cluster == 2:
        for i in range(0, 20):
            j = random.randrange(0, len(onlyanomfiles), 3)
            k = random.randrange(0, len(onlynormfiles), 3)
            norm_arr.append(distance_calc(example, join(mynormpath, onlynormfiles[k])))
            anom_arr.append(distance_calc(example, join(myanompath, onlyanomfiles[j])))
        norm_arr.sort()
        anom_arr.sort()
        return norm_arr, anom_arr
    for i in range(1, 21):
        j = random.randrange(1, 100)
        k = random.randrange(1, 100)
        norm_arr.append(distance_calc(example, "./data/norm/norm"+str(j)+".png"))
        anom_arr.append(distance_calc(example, "./data/anom/anom"+str(j)+".png"))
    norm_arr.sort()
    #print(norm_arr)
    #print(anom_arr)
    anom_arr.sort()
    return norm_arr, anom_arr

def comparision(norm, anom):
    acount=0
    ncount=0
    for i in range(0,len(norm)):
    #     ncount+=norm[i]
    #     acount+=anom[i]
    # if acount/len(norm) < ncount/len(norm):
    #     return 1
    # else:
    #     return 0
        if norm[i] > anom[i]:
            ncount+=1
        else:
            acount+=1
    if acount > ncount:
        return 0
    else: 
        return 1

def acc(result, expected):
    count = 0
    for i in range(len(result)):
        if result[i] == expected[i]:
            count+=1
    return count/len(result)
'''classifier'''
result = []
result1 = []
expected = []
mynormpath = "../newdatafiles"
myanompath = "../newanomdatafiles"
onlynormfiles = [f for f in listdir(mynormpath) if isfile(join(mynormpath, f))]
onlyanomfiles = [f for f in listdir(myanompath) if isfile(join(myanompath, f))]
for i in range(0,10):
    j = random.randrange(1, 100)
    k = random.randrange(0, len(onlyanomfiles), 3)
    norm1, anom1 = image_distance("./data/anom/anom"+str(j)+".png", 1)
    norm2, anom2 = image_distance(join(myanompath, onlyanomfiles[k]), 2)
    result.append(comparision(norm1, anom1))
    result1.append(comparision(norm2, anom2))
for i in range(0,10):
    j = random.randrange(1, 100)
    k = random.randrange(0, len(onlynormfiles), 3)
    norm1, anom1 = image_distance("./data/norm/norm"+str(j)+".png", 1)
    norm2, anom2 = image_distance(join(mynormpath, onlynormfiles[k]), 2)
    result.append(comparision(norm1, anom1))
    result1.append(comparision(norm2, anom2))
for i in range(0,10):
    expected.append(0)
for i in range(0,10):
    expected.append(1)

print(result)
print((acc(result, expected)+acc(result1, expected))/2)