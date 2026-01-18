const http = require('http');

const data = JSON.stringify({
    symbol: 'BTCUSDT',
    side: 'BUY',
    quantity: '0.001'
});

const options = {
    hostname: 'localhost',
    port: 9000,
    path: '/api/trade',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`StatusCode: ${res.statusCode}`);
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
