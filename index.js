const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.werzz.mongodb.net/?retryWrites=true&w=majority`;

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
    console.log("Successfully connected to MongoDB!");

    // Collections
    const db = client.db("learnify");
    const languagesCollection = db.collection("languages");
    const tutorialsCollection = db.collection("tutorials");
    const bookedTutorsCollection = db.collection("bookedTutors");

    // Routes
    // Languages APIs
    app.get("/languages", async (req, res) => {
      try {
        const result = await languagesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch languages" });
      }
    });

    // app.get("/languages/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     if (!ObjectId.isValid(id)) {
    //       return res.status(400).send({ error: "Invalid ID format" });
    //     }
    //     const result = await languagesCollection.findOne({
    //       _id: new ObjectId(id),
    //     });
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to fetch language" });
    //   }
    // });

    // Tutors APIs
    app.get("/tutorials", async (req, res) => {
      try {
        const result = await tutorialsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tutors" });
      }
    });

    app.get("/tutorials/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID format" });
        }
        const result = await tutorialsCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tutor" });
      }
    });

    // Tutorials APIs
    app.post("/tutorials", async (req, res) => {
      try {
        const tutorial = req.body;
        const result = await tutorialsCollection.insertOne(tutorial);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to post tutorial" });
      }
    });

    app.get("/tutorials", async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { email } : {};
        const result = await tutorialsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tutorials" });
      }
    });
    // get tutorials

    // app.get('/tutorials',async(req,res)=>{
    //   const cursor = tutorialsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // })

    // Update tutorial
    app.put("/tutorials/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedTutorial = req.body;
      const tutorial = {
        $set: {
          name: updatedTutorial.name,
          image: updatedTutorial.image,
          language: updatedTutorial.language,
          description: updatedTutorial.description,
          price: updatedTutorial.price,
        },
      };
      const result = await tutorialsCollection.updateOne(
        filter,
        tutorial,
        options
      );
      res.send(result);
    });

    //delete tutorial
    app.delete("/tutorials/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID format" });
        }
        const result = await tutorialsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete tutorial" });
      }
    });

    app.get("/tutorials/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID format" });
        }
        const result = await tutorialsCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tutorial" });
      }
    });

    //   find tutors based on category

    app.get("/tutorials/category/:language", async (req, res) => {
      try {
        const { language } = req.params;
        const query = { language: language };
        const tutors = await tutorialsCollection.find(query).toArray();
        res.send(tutors);
      } catch (error) {
        console.error("Error fetching tutors by category:", error);
        res.status(500).send({ error: "Failed to fetch tutors" });
      }
    });

    // booked tutors

    app.post("/booked-tutors", async (req, res) => {
      const bookedTutor = req.body;
      console.log(bookedTutor);
      const result = await bookedTutorsCollection.insertOne(bookedTutor);
      res.send(result);
    });

    // my booked tutors


    app.get('/booked-tutors', async (req, res) => {
          const cursor = bookedTutorsCollection.find();
          const result = await cursor.toArray();
          res.send(result);
    });
    

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Learnify server is running");
});

app.listen(port, () => {
  console.log("Server is listening at port:", port);
});
