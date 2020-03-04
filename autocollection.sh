for i in {1..100}
do
sudo node server.js&
sleep 5;
curl -d '{"cardname":"blah$i","cardno":"$i","expiry":"22/19","cvv":"$i"}' -H "Content-Type: application/json" -X POST http://localhost:8081/formsubmit;
sudo killall perf;
sleep 5;
sudo perf script > autotestdata$i.txt;
sed '/perf/d' autotestdata$i.txt > autoacttestdata$i.txt;
rm autotestdata$i.txt;
done
