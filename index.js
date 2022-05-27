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

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();

        const productCollection = client.db('manufacturedb').collection('products');
        const orderCollection = client.db('manufacturedb').collection('orders');
        const userCollection = client.db('manufacturedb').collection('users');

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' })
            }
        }

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

        // LOAD ALL USERS
        app.get('/user', verifyJwt, verifyAdmin, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        // ADD A ORDER
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // LOAD A USER ORDER
        app.get('/orders', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const order = await orderCollection.find(query).toArray();
                res.send(order)
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }
        });

        // DELETE A ORDER
        app.delete('/orders/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        });

        // ADD USERS
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
            res.send({ result, token });
        });

        // MAKE USER AN ADMIN
        app.put('/user/admin/:email', verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // FIND ADMIN USER ONLY
        app.get('/admin/:email', verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        });

        // ADD A PRODUCT
        app.post('/addproduct', verifyJwt, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        // MANAGE ALL ORDERS
        app.get('/allorders', verifyJwt, verifyAdmin, async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        });

        // MANAGE ALL DATA
        app.get('/manageproducts', verifyJwt, verifyAdmin, async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
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