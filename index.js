const express = require("express");
const cors = require("cors");

const corsOptions = {
  origin: ["http://localhost:5173",'https://learnify-5acd7.web.app','https://learnify-5acd7.firebaseapp.com'],
  credentials: true,
  optionalSuccessStatus: 200,
};

const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.werzz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// verify Token
const verifyToken = (req, res, next) => {
  // console.log("hello,i am middleware");
  // console.log(req.cookies)
  const token = req.cookies?.token;
  // console.log(token);
  //   const token = req.cookies?.token; // Extract token from cookies
  if (!token) {
    return res
      .status(401)
      .send({ message: "Unauthorized access - Token missing" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res
        .status(403)
        .send({ message: "Forbidden access - Invalid token" });
    }

    req.user = decoded; // Attach decoded payload to the request
    next();
  });
};

// const verifyToken = (req, res, next) => {
//   const token = req.cookies?.token;
//   if (!token) return res.status(401).send({ message: "unauthorized access" });
//   jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: "unaauthorized access" });
//     }
//     req.user = decoded;
//     // console.log(decoded);
//   });

//   next();
// };

async function run() {
  try {
    // await client.connect();
    // console.log("Successfully connected to MongoDB!");

    // Collections
    const db = client.db("learnify");
    const languagesCollection = db.collection("languages");
    const tutorialsCollection = db.collection("tutorials");
    const bookedTutorsCollection = db.collection("bookedTutors");
    //generate jwt token
    app.post("/jwt", async (req, res) => {
      const  email  = req.body;

      // Create token
      const token = jwt.sign(email, process.env.SECRET_KEY, {
        expiresIn: "365d",
      });
      // console.log("Generated Token:", token);

      res
        .cookie("token", token, {
          httpOnly: true,
          secure:false,//http://localhost:5173/signIn
          // secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // app.post("/jwt", async (req, res) => {
    //   const email = req.body;
    //   //create token
    //   const token = jwt.sign(email, process.env.SECRET_KEY, {
    //     expiresIn: "365d",
    //   });
    //   console.log(token);
    //   res
    //     .cookie("token", token, {
    //       httpOnly: true,
    //       secure: process.env.NODE_ENV === "production",
    //       sameSite: process.env.NODE_ENV === "prduction" ? "none" : "strict",
    //     })
    //     .send({ success: true });
    // });
    //logout // clear cookie from browser

    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "prduction" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Routes
    // Languages APIs
    app.get("/languages",async (req, res) => {
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
    app.post("/tutorials",verifyToken, async (req, res) => {
      try {
        // console.log('NOW INSIDE API CALLBACK')
        const tutorial = req.body;
        const result = await tutorialsCollection.insertOne(tutorial);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to post tutorial" });
      }
    });
    // total tutors count

    app.get("/tutors/count", async (req, res) => {
      try {
        const tutorsCount = await tutorialsCollection.countDocuments();
        res.status(200).send({ count: tutorsCount });
      } catch (error) {
        console.error("Error fetching user count:", error.message);
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch user count" });
      }
    });

    app.get("/tutorials",verifyToken, async (req, res) => {
      try {
        // console.log(req.ph);
        const decodedEmail = req.user?.email;
        const email = req.query.email;
        const query = email ? { email } : {};
        // console.log(email, decodedEmail);
        if (decodedEmail !== email)
          return res
            .status(401)
            .send({ message: "Unauthorized access - Token missing" });
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
    app.put("/tutorials/:id",verifyToken, async (req, res) => {
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
    app.delete("/tutorials/:id",verifyToken, async (req, res) => {
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

    app.post("/booked-tutors",verifyToken, async (req, res) => {
      try {
        const bookedTutor = req.body;
        // console.log(bookedTutor);
        delete bookedTutor._id; // The new booking data
        // Check if the tutor is already booked by any user
        const existingBooking = await bookedTutorsCollection.findOne({
          _id: ObjectId(bookedTutor._id),
        });

        if (existingBooking) {
          // If the booking already exists, return a response
          return res.status(200).send({
            success: false,
            message: "This tutor has already been booked.",
          });
        }

        // If no existing booking, proceed to insert the new booking
        const result = await bookedTutorsCollection.insertOne(bookedTutor);
        res.status(201).send({
          success: true,
          message: "Tutor booked successfully.",
          result,
        });
      } catch (error) {
        console.error("Error booking tutor:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to book tutor." });
      }
    });

    // my booked tutors

    app.get("/booked-tutors",verifyToken, async (req, res) => {
      const cursor = bookedTutorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
      // console.log(bookedTutorsCollection)
    });

    // Create a new route for user registration
    app.post("/register", async (req, res) => {
      const { name, email, photoURL } = req.body;

      try {
        // Ensure the email is unique
        const existingUser = await client
          .db("learnify")
          .collection("users")
          .findOne({ email });
        if (existingUser) {
          return res.status(400).send({ message: "User already registered" });
        }

        // Insert new user into the `users` collection
        const result = await client
          .db("learnify")
          .collection("users")
          .insertOne({
            name,
            email,
            photoURL,
            createdAt: new Date(),
          });

        res
          .status(201)
          .send({
            success: true,
            message: "User registered successfully",
            result,
          });
      } catch (error) {
        console.error("Error registering user:", error.message);
        res
          .status(500)
          .send({ success: false, message: "Failed to register user" });
      }
    });

    // Create a new route to fetch the count of registered users
    app.get("/users/count", async (req, res) => {
      try {
        const userCount = await client
          .db("learnify")
          .collection("users")
          .countDocuments();
        res.status(200).send({ count: userCount });
      } catch (error) {
        console.error("Error fetching user count:", error.message);
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch user count" });
      }
    });

    //  update review count

    // Increment review count for a tutor
    app.put("/booked-tutors/:id/review", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format" });
      
      }

      try {
        const filter = { _id: new ObjectId(id) };
        const update = { $inc: { reviews: 1 } }; // Increment `reviews` by 1

        const result = await bookedTutorsCollection.updateOne(filter, update);

        if (result.modifiedCount === 0) {
          return res.status(404).send({ message: "Tutor not found" });
        }

        res
          .status(200)
          .send({ success: true, message: "Review count incremented" });
      } catch (error) {
        console.error("Error updating review count:", error.message);
        res.status(500).send({ message: "Failed to update review count" });
      }
    });
    // Backend Route to Fetch Total Reviews
    app.get("/reviews/count", async (req, res) => {
      try {
        const result = await bookedTutorsCollection
          .aggregate([
            {
              $group: {
                _id: null, // Group all documents into a single group
                totalReviews: { $sum: "$reviews" }, // Sum the `reviews` field across all documents
              },
            },
          ])
          .toArray();

        const totalReviews = result[0]?.totalReviews || 0; // Handle cases with no reviews
        res.status(200).send({ totalReviews });
      } catch (error) {
        console.error("Error fetching total reviews:", error.message);
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch total reviews" });
      }
    });

    //get profile picture

    app.get("/user-profile", async (req, res) => {
      const email = req.query.email;
      try {
        const user = await client
          .db("learnify")
          .collection("users")
          .findOne({ email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        res.status(200).send(user);
      } catch (error) {
        res.status(500).send({ message: "Error fetching user data", error });
      }
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
