from os import listdir
from os.path import isfile, join
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

def image_distance(example):
    '''Calculates distance between image and cluster'''
    
    norm_arr = []
    anom_arr = []
    for i in range(1,11):
        norm_arr.append(distance_calc(example, "norm"+str(i)+".png"))
        anom_arr.append(distance_calc(example, "anom"+str(i)+".png"))
    norm_arr.sort()
    #print(norm_arr)
    #print(anom_arr)
    anom_arr.sort()
    return norm_arr, anom_arr

def comparision(norm, anom):
    acount=0
    ncount=0
    for i in range(0,len(norm)):
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
expected = []

onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
for i in range(51,61):
    norm, anom = image_distance("anom"+str(i)+".png")
    expected.append(0)
    result.append(comparision(norm, anom))
for i in range(51,61):
    expected.append(1)
    norm, anom = image_distance("norm"+str(i)+".png")
    result.append(comparision(norm, anom))

print(result)
accuracy = acc(result, expected)
print(accuracy)