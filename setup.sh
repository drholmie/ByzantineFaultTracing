apt -y update
apt-get install -y  curl;
curl -sL https://deb.nodesource.com/setup_10.x | bash - ;
apt-get install -y nodejs;
apt install -y linux-tools-common;
apt install -y linux-tools-`uname -r`;
