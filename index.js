const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config()
const app = express();
app.use(cors());
app.use(express.json());

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mycoffeeshopcluster.kng2piu.mongodb.net/?retryWrites=true&w=majority&appName=MyCoffeeShopCluster`;

const port = process.env.PORT || 3000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const coffeShopDB = client.db("coffeeShopDB");
    const coffeShopCollection = coffeShopDB.collection("coffeShopCollection");
    const coffeShopUserCollection = coffeShopDB.collection("userCollection");


    //add user
app.post("/users", async (req, res) => {
  const { name, companyName, photoUrl, email, uid } = req.body;

  // 1️⃣ Basic validation
  if (!email || !name) {
    return res.status(400).json({ error: "Missing name or email" });
  }

  try {
    // 2️⃣ Check if user already exists
    const existingUser = await coffeShopUserCollection.findOne({ email });

    if (existingUser) {
      // Optional: update photo/name if changed
      await coffeShopUserCollection.updateOne(
        { email },
        { $set: { name, companyName, photoUrl, uid, updatedAt: new Date() } }
      );

      return res.status(200).json({
        success: true,
        message: "User already exists. Info updated.",
      });
    }

    // 3️⃣ Insert new user
    const result = await coffeShopUserCollection.insertOne({
      name,
      companyName,
      photoUrl,
      email,
      uid,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      insertedId: result.insertedId,
      message: "New user added successfully.",
    });
  } catch (err) {
    console.error("DB insert failed:", err);
    res.status(500).json({ error: "Database operation failed" });
  }
});


//user filter by email
app.get('/users/:email', async (req, res) => {
  try {
    const user = await coffeShopUserCollection.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});





    // Add Coffee
    app.post("/addCoffee", async (req, res) => {
      const newCoffee = req.body;
      const result = await coffeShopCollection.insertOne(newCoffee);
      res.send(result);
    });

    // Get All Coffees
    app.get("/coffees", async (req, res) => {
      const cursor = coffeShopCollection.find({});
      const coffees = await cursor.toArray();
      res.send(coffees);
    });

      app.get('/users',async(req,res)=>{
        const cursor=coffeShopUserCollection.find({});
        const users=await cursor.toArray();
        res.send(users);
    })

    // Delete Coffee
    app.delete("/coffees/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid coffee ID" });
      }

      const query = { _id: new ObjectId(id) };
      const result = await coffeShopCollection.deleteOne(query);
      res.send(result);
    });

    // Update Coffee (PATCH)
    app.patch("/coffees/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid coffee ID" });
      }

      const updatedCoffee = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: updatedCoffee.name,
          supplier: updatedCoffee.supplier,
          taste: updatedCoffee.taste,
          category: updatedCoffee.category,
          details: updatedCoffee.details,
          photo: updatedCoffee.photoURL,
          price: updatedCoffee.price,
        },
      };

      try {
        const result = await coffeShopCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Coffee not found" });
        }

        const coffee = await coffeShopCollection.findOne(query);
        res.json(coffee);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update coffee" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Don't close client, keep server running
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Coffee?");
});

app.listen(port, () => console.log(`Server running on port ${port}!`));
