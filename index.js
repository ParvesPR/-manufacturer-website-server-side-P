const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// CONNECT TO MONGO DB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ey7au.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log('DB connected');

async function run() {
    try {
        await client.connect();

        const productCollection = client.db('manufacturedb').collection('products');
        const orderCollection = client.db('manufacturedb').collection('orders');

        // GET ALL DATA
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });

        // GET ITEM BY PRODUCT ID
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        });

         // ADD A ORDER
         app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
         });
    }

    finally { }
};
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send("Apar parts server running")
});

app.listen(port, () => {
    console.log('Listening to port', port)
})