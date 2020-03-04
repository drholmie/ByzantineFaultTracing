sudo killall perf;
sleep 5;
sudo perf script > autotestdata.txt;
sed '/perf/d' autotestdata.txt > autoacttestdata.txt;
python3 gen.py;
