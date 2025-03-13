require('dotenv').config({path: 'C:\\Users\\pranj\\b-projects\\inventory-management-backend\\.env'})
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
    res.json({
        "msg":"Inventory-management server"
    }).status(200)
})

app.get('/users', async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('users').find().toArray();
        res.status(200).json(users);
        }
 
 catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/users', async(req, res)=>{
try{
    const users = await mongoose.connection.db.collection('users')
    const result = await users.insertOne(req.body)
    res.status(200).json(result)
}
catch(e){
    res.status(500).json({
        "err":{e}
    })
}
})

app.post('/customers', async(req, res)=>{
    try{
        const customers = await mongoose.connection.db.collection('customers')
        const result = await customers.insertOne(req.body)
        res.status(200).json(result)
    }
    catch(e){
        res.status(500).json({
            "err":{e}
        })
    }
    }) 

app.get('/customers', async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('customers').find().toArray();
        res.status(200).json(users);
        }
    catch (e) {
    console.error("Error fetching customers:", e);
    res.status(500).json({ error: {e} });
    }
});
   

const port = process.env.PORT || '4000'
app.listen(port, ()=>{
    console.log(`Running on ${port}`)
})