const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
// middleware

app.use(cors());
app.use(express.json());

// mongodb setup

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.izzbewl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

// my all database related code. First connect database and create collections.

    const database = client.db('shopManagement');
    // product collection
    const productCollection = database.collection('products');
    // user collection
    const userCollection = database.collection('user');


    // JWT

  // verify jwt

  const verifyJWT = (req, res, next)=>{
    const authorization = req.headers.authorization;
    if(!authorization){
      return res.status(401).send({
        error: true,
        message: 'Error Unauthorized Access'
      })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
      if(error){
        res.status(402).send({error:true, message: 'Unauthorized Access'})
      }
      req.decoded = decoded;
      next();
    })
  }


    // user related apis
    
    // user signup

    app.post('/signup', async(req,res)=>{
      const {name,email,password} = req.body;
      let hashpassword;
      if(password){
        const saltRounds = 10;
        hashpassword = await bcrypt.hash(password, saltRounds);
      }
      const query = {email: email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'Email Already Exist'})
      }
      const result = userCollection.insertOne({
        email,
        name,
        password: hashpassword
      });

      res.send({status: true, message: 'Registration Successful', result});

    });

    // user login

    app.post('/login', async(req,res)=>{
      const {email, password} = req.body;

      const user = await userCollection.findOne({email:email});
      console.log(user)
      if(!user){
        return res.send({status: 'fail',message: 'Invalid Email'});
      }
      const passwordMatch = await bcrypt.compare(password,user.password);
      if(!passwordMatch){
        return res.send({status:'fail',message: 'Password Invalid'});
      }

      const token = jwt.sign({email: user.email, name: user.name},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '10h'
      });
      newUser={
        _id: user._id,
        email: user.email,
        name: user.name
      }

      res.send({status: 'success', accessToken: token, message: 'Login Successful', newUser});
    })


    // shoe Management

    // get Shoe

    app.get('/shoe', async(req,res)=>{
      const shoe = await productCollection.find().toArray();
      res.send(shoe)
    })

    // add shoe

    app.post('/addshoe', async(req,res)=>{
      const data= req.body;
      const result = productCollection.insertOne(data);
      res.send({message: 'Product Added Successfully', result});
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);



// full app get
app.get('/', (req,res)=>{
    res.send('Shop Is Running');
})

app.listen(port, ()=>{
    console.log(`Shop is running on port ${port}`);
})