joomscan -u 127.0.0.1:8081;
sudo killall perf;
sleep 5;
sudo perf script > anomautotestdata.txt;
sed '/perf/d' anomautotestdata.txt > anomautoacttestdata.txt;
sudo perf record -e cache-references,cache-misses -a;
