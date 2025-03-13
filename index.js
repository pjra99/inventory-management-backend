require('dotenv').config({path: 'C:\\Users\\pranj\\b-projects\\inventory-management-backend\\.env'})
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)
console.log("Conneted to Mongodb")
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

app.all('/users', async (req, res) => {
    // console.log(req.method)
    if (req.method==="GET"){
        try {
            const users = await mongoose.connection.db.collection('users').find().toArray();
            res.status(200).json(users);
            }
     
     catch (e) {
        console.error("Error fetching users:", e);
        res.status(500).json({ error: "Internal Server Error" });
        }
    }
    else if (req.method==="POST")
        {
        try{
            const users = await mongoose.connection.db.collection('users')
            const result = req.body.length? await users.insertMany(req.body):await users.insertOne(req.body)
            res.status(200).json(result)
        }
        catch(e){
            res.status(400).json({"Error inserting user(s)":e})
        }
    }
});

app.all('/customers', async(req, res)=>{
    if(req.method==="GET"){
        try {
            const customers = await mongoose.connection.db.collection('customers').find().toArray();
            res.status(200).json(customers);
            }
     
     catch (e) {
        res.status(500).json({ "Err": e });
        }
    }
    else if(req.method==="POST") {
        try{
            const customers = await mongoose.connection.db.collection('customers')
            const result = req.body.length? await customers.insertMany(req.body):await customers.insertOne(req.body)
            res.status(200).json(result)
        }
        catch(e){
            res.status(400).json({"Error inserting user(s)":e})
        }
    }
    
    }) 



const port = process.env.PORT || '4000'
app.listen(port, ()=>{
    console.log(`Running on ${port}`)
})