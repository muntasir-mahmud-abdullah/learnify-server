const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.werzz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // languages related apis
    const languagesCollection = client.db("learnify").collection("languages");
    app.get("/languages", async (req, res) => {
      const cusor = languagesCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });
    app.get("/languages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await languagesCollection.findOne(query);
      res.send(result);
    });
    // tutors related apis
    const tutorsCollection = client.db("learnify").collection("tutors");
    const bookedTutorsCollection = client
      .db("learnify")
      .collection("booked_tutors");
    const tutorialsCollection = client.db("learnify").collection("tutorials");
    app.get("/tutors", async (req, res) => {
      const cusor = tutorsCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });
    app.get("/tutors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });

    // post tutorial

    app.post("/tutorials", async (req, res) => {
      const tutorial = req.body;
      const result = await tutorialsCollection.insertOne(tutorial);
      res.send(result);
    });

    //my tutorials
    app.get("/tutorials", async (req, res) => {
      const email = req.query.email;
      let query = null;
      if (email) {
        query = { email: email };
      }
      const cusor = tutorialsCollection.find(query);
      const result = await cusor.toArray();
      res.send(result);
    });

    //Booked Tutors apis
    //get all data ,get one data , get some dat [0,1,many]
    app.get("/booked-tutor", async (req, res) => {
      const email = req.query.email;
      const query = { user_email: email };
      const result = await bookedTutorsCollection.find(query).toArray();
      //aggregation of data
      // name,image, language,price,and review btn
      for (const bookedTutor of result) {
        // console.log(bookedTutor.tutor_id);
      }
      res.send(result);
    });

    app.post("/booked-tutors", async (req, res) => {
      const booked = req.body;
      const result = bookedTutorsCollection.insertOne(booked);
      res.send(result);
    });

    // fetch booked tutor by id

    app.get("/myTutors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("respond send");
});
app.listen(port, () => {
  console.log("port listening at:", port);
});
