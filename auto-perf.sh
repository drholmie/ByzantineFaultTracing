sudo perf record -e cache-references,cache-misses -a node --interpreted-frames-native-stack --perf-basic-prof-only-functions server.js;
sudo perf script > testdata.txt;
sed '/perf/d' testdata.txt > acttestdata.txt;
