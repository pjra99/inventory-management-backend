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

app.get(":org_id/orders/:order_id?", async(req, res)=>{
        try{
            let orders = await mongoose.connection.db.collection('orders').find().toArray()
            res.status(200).json(orders)
        }
        catch(e){
            res.status(400).json({"Error":e})
        }
})
app.post('/:org_id/orders/:customer_id', async()=>{
    
      try{
        let org_id = req.params["org_id"]
        let order_id = await mongoose.connection.db.collection("orders").getLastInsertedDocument.find().sort({_id:-1}).limit(1);
        let order_payload = {
                    "org_id": org_id,
                    "date": date.now(),
                    "customer_id": customer_id,
                    "order_id": order_id+1,
                    "products": req.body
        }    
    
        for (let i =0; i<req.body.length; i++){
            let product_json = await mongoose.connection.db.collection("products").find({"product_id": req.body.product_id})
            let lot_size_in_order = req.body[i].lot_size.product_json.min_lot_size<1? 0:req.body[i].lot_size.product_json.min_lot_size
            let total_units_in_order = req.body[i].unit
            let profit= (product_json.selling_price-product_json.cost_price)*total_units_in_order
            let discount = product_json.discount*0.01 *(lot_size_in_order<1?1:lot_size_in_order )
            let final_profit = profit - discount
            let updateProductsCollection = await mongoose.connection.db.collection("products").updateOne(
                { product_id: req.body["product_id"] },
                { $inc: {["availability"]: -total_units_in_order},
                    }
                );
            let updateStockDetails = mongoose.connection.db.collection("stock_details").updateOne(
                {product_id: req.body["product_id"]},
                {$inc: {["lot_sold"]: lot_size_in_order<1?0:lot_size_in_orderunit/lot_size}},
                {$inc: {["profitTotal"]: final_profit}}
            )
        } 
        let response = mongoose.connection.db.collection("orders").insertOne(order_payload)

        res.status(200).json({"msg": "Success"})
      }
      catch(e){
        res.status(400).json({"Err": e})
      }

})
app.all('/users/:email?', async (req, res) => {

    if (req.method==="GET"){
        if(req.params['email']){
        try{
            let user = await users_collection.find({"email":req.params['email']}).toArray()
            res.status(200).json(user.length==0? {"EmailAlreadyRegistered":false}: {"EmailAlreadyRegistered":true})
        }
        catch(e){
            res.status(500).json({ error: "Internal Server Error" });
        }
        }
        else{
            //if we don't have email param in url
            try {
                let users =await mongoose.connection.db.collection('users').find().toArray();
                res.status(200).json(users);
                }
         
         catch (e) {
            console.error("Error fetching users:", e);
            res.status(500).json({ error: "Internal Server Error" });
            }
        }
    }
    else if (req.method==="POST")
        {
        try{
            const users = await mongoose.connection.db.collection('users')
            const response = req.body.length? await users.insertMany(req.body):await users.insertOne(req.body)
            res.status(200).json(response)
        }
        catch(e){
            res.status(400).json({"Error inserting user(s)":e})
        }
    }
});

app.all('/:org_id/customers', async(req, res)=>{
    const customer_collection = await mongoose.connection.db.collection('customers')
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
            const response = Array.isArray(req.body)? await customers.insertMany(req.body):await customers.insertOne(req.body)
            res.status(200).json(response)
        }
        catch(e){
            res.status(400).json({"Error inserting user(s)":e})
        }
    }
    }) 
    app.get("/:org_id/productId/:productid", async()=>{
        try{
            const product = await mongoose.connection.db.collection('products').find({
                "product_id": req.params['product_id']
            }).toArray()
            res.status(200).json(product)
        }
        catch(e){
            res.status(500).json({ "Err": e });
        }
    })
    app.all('/:org_id/products/:product_category?/:product_id?/:start_date?/:end_date?', async(req, res)=>{
        if(req.method==="GET"){
            let product_category = req.params['product_category']
            if(product_category){
                try{
                    const products = await mongoose.connection.db.collection('products').find({
                        "category": product_category
                    }).toArray()
                    res.status(200).json(products)
                }
                catch(e){
                    res.status(500).json({ "Err": e });
                }
            }
            else{
                try {
                    console.log(req.params['product_category'])
                    const products = await mongoose.connection.db.collection('products').find().toArray();
                    res.status(200).json(products);
                    }
             
             catch (e) {
                res.status(500).json({ "Err": e });
                }
            }
        }
        else if(req.method==="POST") {
            let org_id = req.params["org_id"]
            try{
                let request_body = Array.isArray(req.body)? req.body.map((key)=>({
                    ...key,
                    "org_id": org_id
                })):{...req.body,"org_id": org_id}
                const products = await mongoose.connection.db.collection('products')
                const response = Array.isArray(req.body)? await products.insertMany(req.body):await products.insertOne(req.body)
                console.log(request_body)
                res.status(200)
                
            }
            catch(e){
                res.status(400).json({"Error inserting user(s)":e})
            }
        }
        })
    app.all('/:org_id/stock_details', async(req, res)=>{
    if (req.method==="GET"){
        try{
            const stock_details= await mongoose.connection.db.collection('stock_details').find().toArray()
            res.status(200).json(stock_details)
        }
        catch(e){
            res.status(400).json({"Err": e})
        }
    }
    else if (method==="POST"){
        try{
            const stock_details = await mongoose.connection.db.collection('stock_details')
            const response = Array.isArray(req.body)? await stock_details.insertOne(req.body): await stock_details.insertMany(req.body)
            res.status(200).json(response)
        }
        catch(e){
           res.status(400).json({"Err":e})
        }
    }
    }) 

    app.all('/organisation', async(req, res)=>{
        if (req.method==="GET"){
            try{
                const organisation= await mongoose.connection.db.collection('organisation').find().toArray()
                res.status(200).json(organisation)
            }
            catch(e){
                res.status(400).json({"Err": e})
            }
        }
        else if (method==="POST"){
            try{
                const organisation = await mongoose.connection.db.collection('organisation')
                const response = Array.isArray(req.body)? await organisation.insertOne(req.body): await organisation.insertMany(req.body)
                res.status(200).json(response)
            }
            catch(e){
               res.status(400).json({"Err":e})
            }
        }
        }) 

const port = process.env.PORT || '4000'
app.listen(port, ()=>{
    console.log(`Running on ${port}`)
})