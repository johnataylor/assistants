
import express from 'express';
import http from 'http';
import https from 'https';

const app = express();

var baseURL = 'api.openai.com';

var intercept = function(req, res, next) {

    const originalUrl = req.originalUrl;
    const authorization = req.get("Authorization");
    const contentType = req.get("content-type");
    
    var post_data = '';
    req.on('data', function(chunk) {
        post_data += chunk;
    });

    req.on('end', function(){

        console.log(originalUrl);

        var post_options = {
            host: baseURL,
            path: '/v1' + originalUrl,
            method: 'POST',
            headers: {
                'Content-Type': contentType,
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

        var post_req = https.request(post_options, res => {        
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
        });

        post_req.write(post_data);
        post_req.end();        
    });



    next();
}

app.use(intercept); // Here you add your logger to the stack.

var httpServer = http.createServer(app);
var httpsServer = https.createServer(app);

httpServer.listen(3000);
httpsServer.listen(8080);