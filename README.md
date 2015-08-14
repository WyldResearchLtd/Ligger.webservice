Ligger.webservice
-----------------

AWS Ligger.webservice

http://www.bennadel.com/blog/2321-how-i-got-node-js-running-on-a-linux-micro-instance-using-amazon-ec2.htm


create VM Ubuntu server 14.04 (micro)
open port 5433
assign elastic IP (52.16.121.156) - use DNS made easy to create an A record for this to:   ligger-api.fezzee.net
edit .ssh config file
ssh prod-liggerapi

sudo apt-get update
sudo apt-get install git

git clone http://github.com/fezzee/Ligger.webservice


sudo apt-get install nodejs
sudo apt-get install npm
cd Ligger.webservice
npm install
nodejs server.js

NOTE- changed server.js to that listen is only specifying the port as a parameter, instead of the port and host

# non core services should not operate below port 1024, so we use port forwarding

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to 5433

#  if you install Node.js from a package manager your bin may be called nodejs so you just need to symlink it 

sudo ln -s /usr/bin/nodejs /usr/bin/node


#Create Start and Stop scripts for forever 

nano  start
————————————————————————————————————————————————————————————
 #!/bin/bash

 # Invoke the Forever module (to START our Node.js server).
 ./node_modules/forever/bin/forever \
 start \
 -al forever.log \
 -ao out.log \
 -ae err.log \
 server.js
————————————————————————————————————————————————————————————
chmod +x ./start

nano stop
————————————————————————————————————————————————————————————
#!/bin/bash

 # Invoke the Forever module (to STOP our Node.js server).
 ./node_modules/forever/bin/forever stop server.js
————————————————————————————————————————————————————————————
chmod +x ./stop


NOTE- Again refer to http://www.bennadel.com/blog/2321-how-i-got-node-js-running-on-a-linux-micro-instance-using-amazon-ec2.htm

