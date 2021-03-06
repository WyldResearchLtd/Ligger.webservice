Wyld London Underground Webservice  
----------------------------------    
  
AWS wyld.lu.webservice  
later I will use the following lib or create our own an integration with TFL's Universal API inspired by this:
https://www.npmjs.com/package/tfl-api


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
  
non core services should not operate below port 1024, so we use port forwarding  
  
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to 5433  
  
if you install Node.js from a package manager your bin may be called nodejs so you just need to symlink it  
  
sudo ln -s /usr/bin/nodejs /usr/bin/node  
  
  
Start, Stop, and List scripts for forever 
  
nano  start  
—————————————— 
!/bin/bash  
  
'#Invoke the Forever module (to START our Node.js server).  
 ./node_modules/forever/bin/forever \  
 start \  
 -al forever.log \  
 -ao out.log \  
 -ae err.log \  
 server.js  
—————————————————  
chmod +x ./start  
  
export PATH=./node_modules/forever/bin:$PATH  
  
  
Note- also created a script called 'list'  
that is just:  
  
 ./node_modules/forever/bin/forever list  
  
  
  
  
nano stop  
————————————————  
!/bin/bash  
  
Invoke the Forever module (to STOP our Node.js server).  
 ./node_modules/forever/bin/forever stop server.js  
———————————————————  
chmod +x ./stop  
  
  
NOTE- Again refer to http://www.bennadel.com/blog/2321-how-i-got-node-js-running-on-a-linux-micro-instance-using-amazon-ec2.htm  
  
*LOGS*
---------  
  
The ./start script adds logs  
  
-l  LOGFILE      Logs the forever output to LOGFILE  
-o  OUTFILE      Logs stdout from child script to OUTFILE  
-e  ERRFILE      Logs stderr from child script to ERRFILE  
  
Adding -a to this lets the logs append in case you shut down  
  
-al  LOGFILE      Logs the forever output to LOGFILE  
-ao  OUTFILE      Logs stdout from child script to OUTFILE  
-ae  ERRFILE      Logs stderr from child script to ERRFILE  
  
from the root of the EC2 image type:  
  
cat ./Ligger.webservice/out.log  
  
or better yet, use tac (backwards CAT)  
  
tac ./Ligger.webservice/out.log  
  
  
Deploying to ElasticBeanStalk  
------------------- 
$ git init  
$ git add .  
$ git commit -m "initial commit"  
$ eb init my-first-node-api  
  
  
When you d/l the zip from Github, unzip it and go into the folder and zip just server.js and package.json, and upload that.  
 

Using Configuration Files  
  
You can include one or more configuration files with your source bundle. Configuration files must be named with the extension .config (for example, myapp.config) and placed in an .ebextensions top-level directory in your source bundle. Configuration files are executed in alphabetical order. For example, .ebextensions/01run.config is executed before .ebextensions/02do.config.  

Commands  
  
You can use the commands key to execute commands on the EC2 instance. The commands are processed in alphabetical order by name, and they run before the application and web server are set up and the application version file is extracted.  
  
  Key	      Description  
----------  
command       Required. Either an array or a string specifying the command to run. If you use an array, you do not need to escape space characters or enclose command parameters in quotes.  
env           Optional. Sets environment variables for the command. This property overwrites, rather than appends, the existing environment.  
cwd           Optional. The working directory. By default, Elastic Beanstalk attempts to find the directory location of your project. If not found, then "/" is used.  
test          Optional. A command that must return the value true (exit code 0) in order for Elastic Beanstalk to process the command (e.g., a bash script) contained in the command key.  
ignoreErrors  Optional. A boolean value that determines if other commands should run if the command contained in the command key fails (returns a nonzero value). Set this value to true if you want to continue running commands even if the command fails. Set it to false if you want to stop running commands if the command fails. The default value is false.  


  
Here is an example:  
commands:  
  python_install:  
    command: myscript.py  
    cwd: /home/ec2-user  
    env: myvarname: myvarvalue  
    test: '[ ! /usr/bin/python ] && echo "python not installed"'  
  
  
Here's my script for setting the port redirection (as above):

NOTE: Indentation is important. Use 5 spaces, NOT a tab. Also, you cannot use Sudo, and put double quotes around commands that have spaces:  

I added tried adding .ebextensions/redirect.config which was meant to redirect the port, but this didn't work
  
  
The ZIP for upload to EB  
------------------------  
Also, DO NOT USE the UI version (right click) of the OSX Compression to make a Zip file- it add hidden files (__MACOSX)  
Use the commandline:  

zip Archive.zip server.js app.js package.json  

NOTE: I had to use Port 8081 as my listening port for these services, 
because I coudln't get requests sent to the Load Balancer on 80 to redirect to the instances on 5433

Notes on installing on a new instance
------------------------------------
Create these environ vars in Configuration->Software Configuration

DBCONN postgres://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DB]  
PORT 8081  
SHAREDSECRET  [SECRET]  
LOADIO  loadio  
  
Load Testing  
-----------   
http://aws.amazon.com/articles/1636185810492479  
this explains why during my 250 connections in 1 min, no errors are returned, but straight after, I get a 503  
  
  
Common Pitfalls When Testing Elastic Load Balancing  

Elastic Load Balancing Capacity Limits Reached  
Elastic Load Balancing will likely never reach true capacity limits, but until it scales based on the metrics, there can be periods in which your load balancer will return an HTTP 503 error when it cannot handle any more requests. The load balancers do not try to queue all requests, so if they are at capacity, additional requests will fail. If traffic grows over time, then this behavior works well, but in the case of significant spikes in traffic or in certain load testing scenarios, the traffic may be sent to your load balancer at a rate that increases faster than Elastic Load Balancing can scale to meet it.  
  
