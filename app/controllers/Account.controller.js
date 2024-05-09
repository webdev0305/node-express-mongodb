// const db = require("../models");
const axios = require('axios');
var bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const url = "mongodb+srv://raheel:yti2UEljRE3zOVBJ@cluster0.gtfoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(url);
const database = client.db("users");



const comparePassword = (plainPass, hashword) => {
  const result = bcrypt.compareSync(plainPass, hashword)
  return result;
};

const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error; // Handle the error appropriately
  }
};
exports.Login = async (req, res) => {
  const {email, password} = req.body;
  
  try {
    // Check if the email address already exists
    const existingUser = await database.collection('accounts').findOne({email:email})
    if (existingUser) 
    {
      if(comparePassword(password, existingUser.password))
      {
        return res.status(201).json({id: existingUser._id});
      }else{
        return res.status(400).json({err: "Password Incorrect"});
      }
    }else{
      return res.status(400).json({err: "There is no User Email"});
    }
  } catch (error) {
    console.error('Error registering user:', error.message);
    return res.status(500).json({err: "Something went wrong!"});
  }
};
exports.Register = async (req, res) => {
  const {email, first_name, last_name, password} = req.body;
  const encryptPassword = await hashPassword(password);
  try {
    // Check if the email address already exists
    const existingUser = await database.collection('accounts').findOne({email:email})
    if (existingUser) {
      return res.status(400).json({err: "Email address already registered!"});
    }else{
      // If email address is unique, create a new user
      const insertResult = await database.collection('accounts').insertOne({email, first_name, last_name, password:encryptPassword})
      return res.status(201).json({id: insertResult.insertedId});
    }
    
  } catch (error) {
    console.error('Error registering user:', error.message);
    return res.status(500).json({err: "Something went wrong!"});
  }
};

exports.VerifyToken = async (req, res) => {
  const {id} = req.body;
  console.log(id)
  try {
    // Check if the email address already exists
    const existingUser = await database.collection('accounts').findOne({_id: ObjectId(id)})
    if(existingUser)
      return res.status(201).json({existingUser});
    else{
      return res.status(500).json({err: "Something went wrong!"});
    }
    
  } catch (error) {
    console.error('Error registering user:', error.message);
    return res.status(500).json({err: "Something went wrong!"});
  }
};

