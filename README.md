# dstatrt
Real Time Server and Client for dstat tool using WebSockets

This is a simple WebSocket based Dstat Server & Client. You can run it on your local or dev server, and use it to realtime monitoring.

With beatifull Hightcharts lib, this tool become very helpfull when you want to do some benchmarks on your server,
and to see it as a graph, rather then dry numbers.

DRAFT!!!!

To install it on the server:

Run on terminal - git clone https://github.com/spaiz/dstatrt.git
Edit config.js file. You can enable/disable dstat plugins, defined enviroment variables for MySQL, Mongodb, Redis ad etc.

Run "npm install" to install needed node modules.
Run "node app.js"

Run "pip install pymongo" to be able use --mongodb plugin
Run "apt-get install python-mysqldb" to be able to use --mysql5-* plugins

![demo](screenshots/1.png)
