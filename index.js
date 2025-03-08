
const {createServer} = require('node:http')

const server = createServer((req, resp)=>{
resp.statusCode =200
resp.headers('Content-Type', 'Text/plain')
resp.end("Hello world")
})


server.listen('5000', '127.0.0.1', ()=>{
console.log('Running on 5000')
})