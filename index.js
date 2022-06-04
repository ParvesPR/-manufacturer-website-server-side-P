const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const reviewCollection = client.db('manufacturedb').collection('reviews');
        const paymentCollection = client.db('manufacturedb').collection('payments');
        const profileCollection = client.db('manufacturedb').collection('profile');

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

        // LOAD DATA FOR HOME PAGE
        app.get('/homepage', async (req, res) => {
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

        // MY PROFILE SAVE DATA
        app.post('/myprofile', async (req, res) => {
            const newUser = req.body;
            const result = await profileCollection.insertOne(newUser);
            res.send(result);
        });

        // MY PROFILE LOAD DATA
        app.get('/myprofile/:email', async (req, res) => {
            const email = req.params.email;
            const user = await profileCollection.findOne({ email: email });
            res.send(user)
        })

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

        // DELETE ALL ORDER 
        app.delete('/allorders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

        // MANAGE ALL DATA
        app.get('/manageproducts', verifyJwt, verifyAdmin, async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });

        // DELETE A PRODUCT BY ADMIN
        app.delete('/manageproducts/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result)
        });

        // POST A REVIEW
        app.post('/review/:id', verifyJwt, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        });

        // GET REVIEW
        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)

        })

        // PRODUCT DETAILS FOR  PAYMENT
        app.get('/product/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await orderCollection.findOne(query);
            res.send(product);
        });

        // PAYMENT GATEWAY
        app.post('/create-payment-intent', verifyJwt, async (req, res) => {
            const product = req.body;
            const price = product.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({ clientSecret: paymentIntent.client_secret })
        });

        // PAYMENT TRANSACTION DETAILS
        app.patch('/product/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                    status: payment.status,
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatedBooking = await orderCollection.updateOne(filter, updatedDoc);
            res.send(updatedBooking);
        });

        // ORDER STATUS
        app.patch('/orderStatus/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const payment = req.body
            console.log(payment);
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: payment.status,
                }
            }
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc)

            const result = await paymentCollection.insertOne(payment)
            res.send(updatedDoc);
        })
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