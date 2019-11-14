for j in {1..100}
do
sudo perf record -e cache-references,cache-misses -a node --interpreted-frames-native-stack --perf-basic-prof-only-functions server.js &
sleep 5;
joomscan -u http://127.0.0.1:8081;
for i in {1..100}
do
curl -d '{"nacardname":"blah","cardno":"$i","piry":"22/19","cvv":"$i"}' -H "Content-Type: application/json" -X POST http://localhost:8081/formsubmit
done
joomscan -u http://127.0.0.1:8081;
sudo killall -2 node;
sleep 5;
sudo perf script > anomtestdata$j.txt;
sed '/perf/d' anomtestdata$j.txt > anomacttestdata$j.txt;
rm anomtestdata$j.txt;
done
