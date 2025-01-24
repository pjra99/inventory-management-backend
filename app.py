from flask import Flask, request, jsonify
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/db"
db = PyMongo(app).db

@app.route("/", methods=["GET"])
def home():
    return "Welcome to Inventory Management!"

@app.route("/users", methods=["GET", "POST"])
def users():
    if request.method == "POST":
        data = request.get_json()
        db.users.insert_one(data)
        return "User added successfully!"
    else:
        users_cursor = db.users.find()
        users = []
        for user in users_cursor:
            user["_id"] = str(user["_id"])
            users.append(user)
        return jsonify({"users": users})

@app.route("/customers", methods=["GET", "POST"])
def customers():
    if request.method == "POST":
        data = request.get_json()
        db.customers.insert_one(data)
        return "Customer added successfully!"
    else:
        customers_cursor = db.customers.find()
        customers = []
        for customer in customers_cursor:
            customer["_id"] = str(customer["_id"])
            customers.append(customer)
        return jsonify({"customers": customers})

@app.route("/products", methods=["GET", "POST"])
def products():
    if request.method == "POST":
        data = request.get_json()
        db.products.insert_one(data)
        return "Product(s) added successfully!"
    else:
        products_cursor = db.products.find()
        products = []
        for product in products_cursor:
            product["_id"] = str(product["_id"])
            products.append(product)
        return jsonify({"products": products})

@app.route("/orders", methods=["GET", "POST"])
def orders():
    if request.method == "POST":
        data = request.get_json()
        db.orders.insert_one(data)
        return "Order(s) added successfully!"
    else:
        orders_cursor = db.orders.find()
        orders = []
        for order in orders_cursor:
            order["_id"] = str(order["_id"])
            orders.append(order)
        return jsonify({"orders": orders})

@app.route("/suppliers", methods=["GET", "POST"])
def suppliers():
    if request.method == "POST":
        data = request.get_json()
        db.suppliers.insert_one(data)
        return "Supplier added successfully!"
    else:
        suppliers_cursor = db.suppliers.find()
        suppliers = []
        for supplier in suppliers_cursor:
            supplier["_id"] = str(supplier["_id"])
            suppliers.append(supplier)
        return jsonify({"suppliers": suppliers})

@app.route("/stock_details", methods=["GET", "POST"])
def stock_details():
    if request.method == "POST":
        data = request.get_json()
        db.stock_details.insert_one(data)
        return "Stock detail(s) add successfully!"
    else:
        stock_details_cursor = db.stock_details.find()
        stock_details = []
        for stock_detail in stock_details_cursor:
            stock_detail["_id"] = str(stock_detail["_id"])
            stock_details.append(stock_details)
            
        return jsonify({"stock_details": stock_details})

@app.route('/notification', methods=['GET', 'POST'])
def notifications():
    if request.method == "POST":
        data = request.get_json()
        db.notifications.insert_one(data)
        return "Notification  added successfully!"
    else:
        notifications_cursor = db.notifications.find()
        notifications = []
        for notification in notifications_cursor:
            notification["_id"] = str(notification["_id"])
            notifications.append(notification)
        return jsonify({"notifications": notifications})

if __name__ == "__main__":
    app.run(debug=True)
