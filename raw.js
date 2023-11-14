
import https from 'https';

var post_data = JSON.stringify({
    "name": "Math Tutor",
    "instructions": "You are a personal math tutor. Write and run code to answer math questions.",
    "tools": [
        {
            "type": "code_interpreter"
        }
    ],
    "model": "gpt-4-1106-preview"
});

var post_options = {
    host: 'api.openai.com',
    path: '/v1/assistants',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(post_data),
        'OPenAI-Beta': 'assistants=v1'
    }
};

var buf = '';

var post_req = https.request(post_options, res => {        
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        buf += chunk;
    });
    res.on('end', function () {
        console.log(buf);
    })
});

post_req.write(post_data);
post_req.end();        
