/**
 * Project 2 Express server connected to MongoDB 'project2'.
 * Start with: node webServer.js
 * Client uses axios to call these endpoints.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from "mongoose";
// eslint-disable-next-line import/no-extraneous-dependencies
import bluebird from "bluebird";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import async from "async";

// ToDO - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// import models from "./modelData/photoApp.js";

// Load the Mongoose schema for User, Photo, and SchemaInfo
// ToDO - Your submission will use code below, so make sure to uncomment this line for tests and before submission!
import User from "./schema/user.js";
import Photo from "./schema/photo.js";
import SchemaInfo from "./schema/schemaInfo.js";

const portno = 3001; // Port number to use
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

mongoose.Promise = bluebird;
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project3", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * /test/info - Returns the SchemaInfo object of the database in JSON format.
 *              This is good for testing connectivity with MongoDB.
 */

app.get('/test/info', async (request, response) => {
  try {
    const info = await SchemaInfo.findOne();
    if (!info) {
      return response.status(404).send();
    }
    return response.status(200).json(info); 
  } catch (err) {
    console.error('Error retrieving SchemaInfo:', err);
    return response.status(500).send();
  }
});

/**
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get('/test/counts', async (request, response) => {
  try {
    const userCount = await User.countDocuments();
    const photoCount = await Photo.countDocuments();
    const schemaInfoCount = await SchemaInfo.countDocuments();

    response.status(200).json({
      user: userCount,
      photo: photoCount,
      schemaInfo: schemaInfoCount
    });
  } catch (err) {
    console.error('Error retrieving counts:', err);
    response.status(500).send();
  }
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get('/user/list', async (request, response) => {
  try {
    const users = await User.find({}, '_id first_name last_name');

    response.status(200).json(users);
  } catch (err) {
    console.error('Error retrieving user list:', err);
    response.status(500).send();
  }
});

/**
 * URL /user/list/counts - Returns photo and comment counts for each user
 */
app.get('/user/list/counts', async (request, response) => {
  try {
    const users = await User.find({}, '_id first_name last_name');
    const photos = await Photo.find({}, 'user_id comments.user_id');

    const counts = users.map((user) => {
      const photoCount = photos.filter((p) => p.user_id.equals(user._id)).length;

      const commentCount = photos.reduce((acc, p) => {
        if (!p.comments) return acc;
        const userComments = p.comments.filter(
          (c) => c.user_id && c.user_id.equals(user._id)
        );
        return acc + userComments.length;
      }, 0);

      return {
        _id: user._id,
        photoCount,
        commentCount,
      };
    });

    response.status(200).json(counts);
  } catch(err) {
    console.error('Error retrieving counts', err);
    response.status(500).send();
  }
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get('/user/:id', async (request, response) => {
  const { id } = request.params;

  // Check if id is valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send('Invalid ID');
  }

  try {
    const user = await User.findById(id, '_id first_name last_name location description occupation');

    if (!user) {
      return response.status(404).send('User not found');
    }

    return response.status(200).json(user);
  } catch (err) {
    console.error('Error retrieving user', err);
    return response.status(500).json();
  }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get('/photosOfUser/:id', async (request, response) => {
  const { id } = request.params;

  // Check if id is valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send('Invalid ID');
  }

  try {
    // Make sure user exists
    const userExists = await User.exists({ _id: id });
    if (!userExists) {
      return response.status(404).send('User not found');
    }

    // Fetch all photos as JS objects
    const photos = await Photo.find({ user_id: id }, '_id user_id comments file_name date_time').lean();

    // Fetch user info for each comment for each photo concurrently
    await async.each(photos, async (photo) => {
      if (photo.comments && photo.comments.length > 0) {
        const updatedComments = await Promise.all(
          photo.comments.map(async (comment) => {
            const commentUser = await User.findById(comment.user_id, '_id first_name last_name');
            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user: commentUser
            };
          })
        );
        photo.comments = updatedComments;
      }
    });

    return response.status(200).json(photos);
  } catch (err) {
    console.error('Error retrieving photos', err);
    return response.status(500).json();
  }
});

app.get("/comments/:userId", async (request, response) => {
  const { userId } = request.params;

  try {
    const photos = await Photo.find(
      { "comments.user_id": userId }, // only photos with the user's comments
      "file_name user_id comments"
    );

    const userComments = [];

    photos.forEach((photo) => {
      if (!photo.comments) return;

      photo.comments.forEach((c) => {
        if (c.user_id.toString() === userId) {
          userComments.push({
            comment: c.comment,
            commentId: c._id,
            photoId: photo._id,
            file_name: photo.file_name,
            photoUserId: photo.user_id,
          });
        }
      });
    });

    response.status(200).json(userComments);
  } catch (err) {
    console.error("Error fetching user comments:", err);
    response.status(500).json({ message: "Server error" });
  }
});

const server = app.listen(portno, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
