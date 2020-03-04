#!/bin/bash
for j in {1..100}
do
sudo perf record -e cache-references,cache-misses -a node --interpreted-frames-native-stack --perf-basic-prof-only-functions server.js &
sleep 2;
for i in {1..100}
do
curl -d '{"nacardname":"blah","cardno":"$i","piry":"22/19","cvv":"$i"}' -H "Content-Type: application/json" -X POST http://localhost:8081/formsubmit
done
sudo killall -2 node;
sleep 2;
sudo perf script > testdata$j.txt;
sed '/perf/d' testdata$j.txt > acttestdata$j.txt;
rm testdata$j.txt;
done
