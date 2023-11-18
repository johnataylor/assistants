
import express from 'express';
import http from 'http';

const app = express();

var intercept = function(req, res, next) {

    const method = req.method;
    const originalUrl = req.originalUrl;
    const contentType = req.get("content-type");
    const openAIBeta = req.get("OpenAI-Beta");
   
    console.log(method);
    console.log(originalUrl);
    console.log(contentType);
    console.log(openAIBeta);

    var post_data = '';
    req.on('data', function(chunk) {
        post_data += chunk;
    });

    req.on('end', function(){

        console.log(post_data);
    });

    next();
}

app.use(intercept);

var httpServer = http.createServer(app).listen(3000);
