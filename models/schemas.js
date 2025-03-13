const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  contact:  String,
  designation: String,
  role: String,
  orgName: String,
  orgType: String,
  role: String,
  orgId: Number
});


const customerSchema = new mongoose.Schema({
    name: String,
    email: String,
    contact: String,
    organisation: String,
    address: String,
    orgId: Number
})



const User = mongoose.model("User", userSchema );

const Customer = mongoose.model("Customer", customerSchema);

module.exports = { User, Customer };
