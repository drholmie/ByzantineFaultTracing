import os
import signal
def perfchild():
    os.system('sudo perf record -e cache-references,cache-misses -a node --interpreted-frames-native-stack --perf-basic-prof-only-functions server.js&')
for i in range(0,101):
    perfchild()
    sleep(5)
    os.system("./datagen.sh")
    sleep(5)
    os.system
