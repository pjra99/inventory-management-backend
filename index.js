require('dotenv').config({path: 'C:\\Users\\pranj\\b-projects\\inventory-management-backend\\.env'})

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
mongoose.connect(process.env.MONGO_URI)
console.log("Conneted to Mongodb")
const express = require('express')
const cors = require('cors')
const app = express()
                    
const allowedOrigins = ['https://inventory-management-backend-1-qqrk.onrender.com','http://localhost:3000', 'https://inventory-management-frontend-e8k2-pjra99s-projects.vercel.app'];
app.use(cors({
    origin: allowedOrigins
}));
// app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
    res.json({
        "msg":"Inventory-management server"
    }).status(200)
})

//get order by id
app.get("/:org_id/orders/:order_id?", async(req, res)=>{
     filter = {}
      if (req.params["order_id"]){
        filter._id = req.params["order_id"]
      } 
      try{
        let orders = await mongoose.connection.db.collection('orders').find(filter).toArray()
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
        //customer_id is customer's email
        
        let total_profit_on_order = 0
        let debg = {}
        // updating quantities/availalability of products after
        for (let i = 0; i < req.body.length; i++) {
            let product_json = await mongoose.connection.db.collection("products").findOne({ "product_id": req.body[i].product_id });

            if (!product_json) {
                return res.status(400).json({ "err": `Product with ID ${req.body[i].product_id} not found` });
            }

            let lot_size_in_order = req.body[i].count>=req.body[i].min_lot_size? Math.floor(req.body[i].count/req.body[i].min_lot_size):0
            let total_units_in_order = req.body[i].count
            let profit_total = (req.body[i].selling_price - req.body[i].cost_price) * total_units_in_order;
            //final price is total price after discounts (if applicable). Selling price is SP per unit of the product
            let final_price = req.body[i].selling_price * total_units_in_order;
            //disount would be per lot
            //below calculations such as discount_per_lot, discount_total, final_profit, etc, are per product in this order
            let discount_per_lot = req.body[i].discount_percentage * 0.01 * lot_size_in_order;
            let discount_total =   discount_per_lot*(lot_size_in_order)
            let final_profit = profit_total - discount_total;
            req.body[i].final_price = final_price
            req.body[i].discount_total = discount_total

            total_profit_on_order+=final_profit
            debg = {
                "lot_size_in_order": lot_size_in_order,
                "total_units_in_order":total_units_in_order,
                "profit_total":profit_total,
                "final_price": final_price,
                "disc_per_lot":discount_per_lot,
                "disc_total":discount_total,
                "final_profit":final_profit
        }
            console.log(debg)
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
        debg ={...debg, "total_profit": total_profit_on_order}
        console.log(debg)
        const now = Date.now();
        const date = new Date(now);
        const formattedDate = date.toLocaleDateString();
        console.log(formattedDate);// Output: e.g., "5/12/2025"
        let order_payload = {
            "org_id": org_id,
            "date": formattedDate,
            "customer_id": customer_id,
            "total_profit": total_profit_on_order,     
            "products": req.body
        };
        await mongoose.connection.db.collection("orders").insertOne(order_payload);

        res.status(200).json({ "msg": "Success" });
    } catch (e) {
        res.status(400).json({ "err": e.message });
    }
});

//users api
app.all('/users/:email?/:password?', async (req, res) => {
    const users_collection = await mongoose.connection.db.collection("users")
    const user = await users_collection.findOne({"email":req.params['email']})
    // console.log(user)
    if (req.method==="GET"){
        if (req.params["email"] && req.params["password"] ){
          try{
            user && await bcrypt.compare(req.params['password'], user.password)? res.status(200).json({"authenticated": true,
                "_id": user._id,
                "org_id": user.org_id
            }):
            res.status(401).json({"authenticated": false})
          }
          catch(e){
            res.status(400).json({"err":e.message})
          }
        }
        else if(req.params['email']){
        try{
            // console.log(user? true:false)
            res.status(200).json({"emailRegistered": !!user})
        }
        catch(e){
            res.status(400).json({"err": e.message});
        }
        }
        else{
            //if we don't have email param in url
            try {
                let users =await users_collection.find().toArray();
                res.status(200).json(users);
                }
         
         catch (e) {
            console.err("err fetching users:", e);
            res.status(400).json({ err: "Internal Server err" });
            }
        }
    }
    else if (req.method==="POST")
        {
        try{
            req.body.password = await bcrypt.hash(req.body.password, 10)
            const userAlreadyRegistered = await users_collection.find({"email": req.body.email})
            console.log(userAlreadyRegistered)
            const response = await userAlreadyRegistered.length>0? {"userAlreadyRegistered": true}:await users_collection.insertOne(req.body)
            res.status(200).json(response)
        }
        catch(e){
            res.status(400).json({"err creating user":e})
        }
    }
});

//customer api
app.all('/:org_id/customers/:customer_id?', async(req, res)=>{
    const customer_collection = await mongoose.connection.db.collection("customers")
    if(req.method==="GET"){
    let filter = {"org_id": req.params["org_id"]}
       if(req.params['customer_id']){
        filter["email"]= req.params["customer_id"]
       }
        try {
        const customers = await customer_collection.find(filter).toArray()
        res.status(200).json(req.params['customer_id']? customers.length>0?{"customerRegistered":true}:{"customerRegistered":false}:{customers});
        }
 
     catch (e) {
       res.status(500).json({ "err": e.message })
    }
    }
    else if(req.method==="POST") {
        console.log("here")
        console.log(req.params["org_id"])
        try{
            const response = await customer_collection.insertOne({...req.body, "org_id": req.params['org_id']})
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
    //get product categories
     app.get("/:org_id/get_product_categories", async(req, res)=>{
        try{
            const response = await mongoose.connection.db.collection("products").distinct("category")
            res.status(200).json(response)
        }
        catch(e){
           res.status(400).json({"err":e.message})
        }
     })
    //products by name
    app.get('/:org_id/fetch_product/:category/:product_name', async (req, res) => {
        const products_collection = await mongoose.connection.db.collection('products')
        try {
            const { org_id, category, product_name } = req.params;
    
            let query = { 
                org_id, 
                name: { $regex: product_name, $options: "i" } // Case-insensitive partial match
            };
           console.log(product_name)
            // If category is provided and not "all", add it to the query
            if (category && category !== "all") {
                query.category = category;
            }
    
            const products = await products_collection.find(query).toArray();
            console.log(products)
            if (products.length > 2) {
                return res.json({ msg: "more than 1 products found" });
            }
            let response = products.length ==0?{"msg": 0}: products[0]
            res.json(response);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    //products api
    app.all('/:org_id/products/:product_category?/:start_date?/:end_date?', async(req, res)=>{
        const products_collection = await mongoose.connection.db.collection('products')
        if(req.method==="GET"){
            // let product_category = req.params['product_category']
            let start_date = req.params["start_date"]
            let end_date = req.params["end_date"]
            let product_category = req.params["product_category"]
            let org_id = req.params["org_id"]
            filter = {"org_id": org_id}
            if(product_category && product_category!=="all"){
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
                const response = await Array.isArray(req.body)? await products_collection.insertMany(request_body):await products.insertOne(request_body)
                console.log(response)
                res.status(200).json(response)
            }
            catch(e){
                res.status(400).json({"err inserting user(s)":e})
            }
        }
        })

    app.all('/:org_id/stock_details/:product_id?', async(req, res)=>{
        const stock_collection = await mongoose.connection.db.collection('stock_details')
    if (req.method==="GET"){
        let filter =  {"org_id": req.params["org_id"]}
        try{
            req.params["product_id"]? filter= {...filter, "_id": req.params["product_id"]}:""
            const stock_details= await stock_collection.find(
                filter
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
        else if (req.method==="POST"){
            try{
                
                const response = Array.isArray(req.body)? await organisations_collection.insertMany(req.body): await organisations_collection.insertOne(req.body)
                res.status(200).json(response)
            }
            catch(e){
               res.status(400).json({"err":e.message})
            }
        }
        }) 

app.get('/this_month_sales', async(req, res)=>{
    try {
        const result = await mongoose.connection.db.collection('orders').aggregate([
          {
            $group: {
              _id: null,
              totalProfit: { $sum: "$amount" }
            }
          }
        ]);
    
        const total = result[0]?.totalProfit || 0;
        res.json({ total });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });


const port = process.env.PORT || '5000'
app.listen(port, ()=>{
    console.log(`Running on ${port}`)
})
