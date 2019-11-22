for i in {1..100}
do
sudo node server.js&
sleep 5;
joomscan -u 127.0.0.1:8081
curl -d '{"cardname":"blah$i","cardno":"$i","expiry":"22/19","cvv":"$i"}' -H "Content-Type: application/json" -X POST http://localhost:8081/formsubmit
sudo killall node;
sleep 5;
done
