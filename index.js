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

//get order by id
app.get("/:org_id/orders/:order_id?", async(req, res)=>{
        try{
            let orders = await mongoose.connection.db.collection('orders').find({_id: req.params["order_id"]}).toArray()
            res.status(200).json(orders)
        }
        catch(e){
            res.status(400).json({"err":e.message})
        }
})


//create order
app.post('/:org_id/orders/:customer_id', async (req, res) => {
    try {
        let org_id = req.params["org_id"];
        let customer_id = req.params["customer_id"];

        let order_payload = {
            "org_id": org_id,
            "date": Date.now(),
            "customer_id": customer_id,
            "products": req.body
        };
        // updating quantities/availalability of products after
        for (let i = 0; i < req.body.length; i++) {
            let product_json = await mongoose.connection.db.collection("products").findOne({ "product_id": req.body[i].product_id });

            if (!product_json) {
                return res.status(400).json({ "err": `Product with ID ${req.body[i].product_id} not found` });
            }

            let lot_size_in_order = unit_type_lot? req.body[i].unit: Math.floor(product_json.min_lot_size/ req.body[i].unit)
            let total_units_in_order = unit_type_lot?product_json.min_lot_size* req.body[i].unit: req.body[i].unit;
            let profit = (product_json.selling_price - product_json.cost_price) * total_units_in_order;
            //disount would be per lot
            let discount = product_json.discount * 0.01 * (lot_size_in_order == 0 ? 1 : lot_size_in_order);
            let final_profit = profit - discount;

            await mongoose.connection.db.collection("products").updateOne(
                { product_id: req.body[i].product_id },
                { $inc: { "availability": -total_units_in_order } }
            );

            await mongoose.connection.db.collection("stock_details").updateOne(
                { product_id: req.body[i].product_id },
                {
                    $inc: {
                        "lot_sold": lot_size_in_order,
                        "profit_total": final_profit
                    }
                }
            );
        }

        await mongoose.connection.db.collection("orders").insertOne(order_payload);

        res.status(200).json({ "msg": "Success" });
    } catch (e) {
        res.status(400).json({ "err": e.message });
    }
});

//users api
app.all('/users/:email?', async (req, res) => {
    let users_collection = await mongoose.connection.db.collection("users")
    if (req.method==="GET"){
        if(req.params['email']){
        try{
            let user = await users_collection.find({"email":req.params['email']}).toArray()
            res.status(200).json(user.length==0? {"EmailAlreadyRegistered":false}: {"EmailAlreadyRegistered":true})
        }
        catch(e){
            res.status(500).json({"err": e.message});
        }
        }
        else{
            //if we don't have email param in url
            try {
                let users =await mongoose.connection.db.collection('users').find().toArray();
                res.status(200).json(users);
                }
         
         catch (e) {
            console.err("err fetching users:", e);
            res.status(500).json({ err: "Internal Server err" });
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
            res.status(400).json({"err inserting user(s)":e})
        }
    }
});

//customer api
app.all('/:org_id/customers', async(req, res)=>{
    const customer_collection = await mongoose.connection.db.collection('customers')
    if(req.method==="GET"){
        try {
            const customers = await customer_collection.find().toArray();
            res.status(200).json({customers});
            }
     
     catch (e) {
        res.status(500).json({ "err": e.message });
        }
    }
    else if(req.method==="POST") {
        try{
            const response = Array.isArray(req.body)? await customers.insertMany(req.body):await customers.insertOne(req.body)
            res.status(200).json(response)
        }
        catch(e){
            res.status(400).json({"err inserting user(s)":e})
        }
    }
    }) 
    
    //get Product by Id
    app.get("/productId/:product_id", async(req, res)=>{
        try {
            let product_id = req.params['product_id']
            const product = await mongoose.connection.db.collection('products').find({
                _id: product_id
            }).toArray();
            console.log(product)
            res.status(200).json(product);
            }
     catch (e) {
        res.status(500).json({ "err": e.message });
        }
    })

    //products api
    app.all('/:org_id/products/:product_category?/:start_date?/:end_date?', async(req, res)=>{
        const products_collection = await mongoose.connection.db.collection('products')
        if(req.method==="GET"){
            // let product_category = req.params['product_category']
            let start_date = req.params["start_date"]
            let end_date = req.params["end_date"]
            let product_category = req.params["product_category"]
            filter = {}
            if(product_category!=="all"){
            filter.category = product_category
            }
            if(start_date && end_date){
                filter.date_added = end_date? {$gte: start_date, $lte: end_date}:{$gte: start_date}
            }
            console.log(filter)
        try {
            console.log(req.params['product_category'])
            const products = await products_collection.find(filter).toArray();
            res.status(200).json(products);
            }
        
             catch (e) {
                res.status(500).json({ "err": e.message });
                }
            
        }
        else if(req.method==="POST") {
            let org_id = req.params["org_id"]
            try{
                let request_body = Array.isArray(req.body)? req.body.map((key)=>({
                    ...key,
                    "org_id": org_id
                })):{...req.body,"org_id": org_id}
                const response = await Array.isArray(req.body)? await products_collection.insertMany(req.body):await products.insertOne(req.body)
                console.log(response)
                res.status(200).json(response)
            }
            catch(e){
                res.status(400).json({"err inserting user(s)":e})
            }
        }
        })

    app.all('/:org_id/stock_details', async(req, res)=>{
        const stock_collection = await mongoose.connection.db.collection('stock_details')
    if (req.method==="GET"){
        try{
            const stock_details= await stock_collection.find(
                {"org_id": req.params["org_id"]}
            ).toArray()
            res.status(200).json(stock_details)
        }
        catch(e){
            res.status(400).json({"err": e})
        }
    }
    else if (req.method==="POST"){
        try{
            if (Array.isArray(req.body)){
                const payload = req.body.map((key)=>({
                    
                        ...key,
                        "org_id": req.params["org_id"]
                        
                    
                }))
                const response = await stock_collection.insertMany(payload)
                res.status(200).json(response)
            }
            else{
              const response = await stock_collection.insertOne(req.body)
              res.status(200).json(response)
            }
            
            
        }
        catch(e){
           res.status(400).json({"err":e.message})
        }
    }
    }) 

    app.all('/organisation', async(req, res)=>{
        const organisations_collection = await mongoose.connection.db.collection('organisation')
        if (req.method==="GET"){
            try{
                const organisation= await organisations_collection.find().toArray()
                res.status(200).json(organisation)
            }
            catch(e){
                res.status(400).json({"err": e.message})
            }
        }
        else if (method==="POST"){
            try{
                
                const response = Array.isArray(req.body)? await organisations_collection.insertOne(req.body): await organisations_collection.insertMany(req.body)
                res.status(200).json(response)
            }
            catch(e){
               res.status(400).json({"err":e.message})
            }
        }
        }) 

const port = process.env.PORT || '5000'
app.listen(port, ()=>{
    console.log(`Running on ${port}`)
})