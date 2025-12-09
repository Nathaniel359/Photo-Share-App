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
import session from "express-session";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import async from "async";
import fs from "fs";
import { Server } from 'socket.io';
import { logActivity } from "./utils/activityLogger.js";

// ToDO - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// import models from "./modelData/photoApp.js";

// Load the Mongoose schema for User, Photo, and SchemaInfo
// ToDO - Your submission will use code below, so make sure to uncomment this line for tests and before submission!
import User from "./schema/user.js";
import Photo from "./schema/photo.js";
import SchemaInfo from "./schema/schemaInfo.js";
import Activity from "./schema/activity.js";

const portno = 3001; // Port number to use
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON request bodies
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }
  return next();
};

mongoose.Promise = bluebird;
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project3", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, join(__dirname, 'images'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop();
    cb(null, 'U' + uniqueSuffix + '.' + ext);
  }
});

const upload = multer({ storage: storage });

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
app.get('/user/list', requireAuth, async (request, response) => {
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
app.get('/user/list/counts', requireAuth, async (request, response) => {
  try {
    const currentUserId = request.session.user._id;
    const users = await User.find({}, '_id first_name last_name');
    const photos = await Photo.find({}, 'user_id comments sharing_list');

    const counts = users.map((user) => {
      // Filter visible photos
      const visiblePhotos = photos.filter((p) => {
        const isOwner = p.user_id.equals(currentUserId);

        // Public (no list)
        if (!p.sharing_list || p.sharing_list === null) {
          return true;
        }

        // Owner only
        if (Array.isArray(p.sharing_list) && p.sharing_list.length === 0) {
          return isOwner;
        }

        // Allow included users to see
        return isOwner || p.sharing_list.includes(currentUserId);
      });

      const photoCount = visiblePhotos.filter((p) => p.user_id.equals(user._id)).length;

      const commentCount = visiblePhotos.reduce((acc, p) => {
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
app.get('/user/:id', requireAuth, async (request, response) => {
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
app.get('/photosOfUser/:id', requireAuth, async (request, response) => {
  const { id } = request.params;
  const currentUserId = request.session.user._id.toString(); 

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
    const photos = await Photo.find({ user_id: id }, '_id user_id comments file_name date_time sharing_list').lean();

    // Filter out photos the current user is not allowed to see
    const visiblePhotos = photos.filter((p) => {
      const isOwner = p.user_id.toString() === currentUserId;

      // Public (no list)
      if (!p.sharing_list || p.sharing_list === null) {
        return true;
      }

      // Owner only
      if (Array.isArray(p.sharing_list) && p.sharing_list.length === 0) {
        return isOwner;
      }

      // Allow included users to see
      return isOwner || p.sharing_list.map(id => id.toString()).includes(currentUserId);
    });

    // Fetch user info for each comment for each photo concurrently
    await async.each(visiblePhotos, async (photo) => {
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

    return response.status(200).json(visiblePhotos);
  } catch (err) {
    console.error('Error retrieving photos', err);
    return response.status(500).json();
  }
});

app.get("/comments/:userId", requireAuth, async (request, response) => {
  const { userId } = request.params;
  const currentUserId = request.session.user._id.toString();

  try {
    const photos = await Photo.find(
      { "comments.user_id": userId }, // only photos with the user's comments
      "file_name user_id comments sharing_list"
    ).lean();

    const userComments = [];

    photos.forEach((p) => {
      const isOwner = p.user_id.toString() === currentUserId;

      let visible = false;
      // Public (no list)
      if (!p.sharing_list || p.sharing_list === null) {
        visible = true;
      }

      // Owner only
      else if (Array.isArray(p.sharing_list) && p.sharing_list.length === 0) {
        visible = isOwner;
      }

      // Allow included users to see
      else if (Array.isArray(p.sharing_list)){
        visible = isOwner || p.sharing_list.map(id => id.toString()).includes(currentUserId);
      }

      if (!visible) return; // skip photos not visible

      if (!p.comments) return;

      p.comments.forEach((c) => {
        if (c.user_id.toString() === userId) {
          userComments.push({
            comment: c.comment,
            commentId: c._id,
            photoId: p._id,
            file_name: p.file_name,
            photoUserId: p.user_id,
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

app.get('/activities', requireAuth, async (request, response) => {
  const activities = await Activity.find({})
    .sort({ created_at: -1 })
    .limit(5)
    .populate('user_id', '_id first_name last_name')
    .populate('photo_id', 'file_name')
    .lean();

  response.json(activities);
});

/**
 * POST /admin/login - Login a user
 */
app.post("/admin/login", async (request, response) => {
  const { login_name, password } = request.body;

  if (!login_name) {
    return response.status(400).send("Login name is required");
  }

  if (!password) {
    return response.status(400).send("Password is required");
  }

  try {
    const user = await User.findOne({ login_name });

    if (!user) {
      return response.status(400).send("User not found");
    }

    // Check password
    if (user.password !== password) {
      return response.status(400).send("Incorrect password");
    }

    // Store user info in session
    request.session.user = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name
    };

    // Log activity
    await logActivity(io, { user: request.session.user, type: "USER_LOGIN"});

    return response.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name
    });
  } catch (err) {
    console.error("Error during login:", err);
    return response.status(500).send("Server error");
  }
});

/**
 * POST /admin/logout - Logout the current user
 */
app.post("/admin/logout", async (request, response) => {
  if (!request.session.user) {
    return response.status(400).send("No user is currently logged in");
  }

  // Log activity
  await logActivity(io, { user: request.session.user, type: "USER_LOGOUT"});

  return request.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return response.status(500).send("Server error");
    }
    return response.status(200).send("Logout successful");
  });
});

/**
 * POST /user - Register a new user
 */
app.post("/user", async (request, response) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = request.body;

  // Validate required fields
  if (!login_name || !login_name.trim()) {
    return response.status(400).send("Login name is required");
  }

  if (!password || !password.trim()) {
    return response.status(400).send("Password is required");
  }

  if (!first_name || !first_name.trim()) {
    return response.status(400).send("First name is required");
  }

  if (!last_name || !last_name.trim()) {
    return response.status(400).send("Last name is required");
  }

  try {
    // Check if login_name already exists
    const existingUser = await User.findOne({ login_name: login_name.trim() });
    if (existingUser) {
      return response.status(400).send("Login name already exists");
    }

    // Create new user
    const newUser = await User.create({
      login_name: login_name.trim(),
      password: password,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      location: location || "",
      description: description || "",
      occupation: occupation || ""
    });

    // Log activity
    await logActivity(io, { user: request.session.user, type: "USER_REGISTER"});

    return response.status(200).json({
      login_name: newUser.login_name,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      _id: newUser._id
    });
  } catch (err) {
    console.error("Error during registration:", err);
    return response.status(500).send("Server error");
  }
});

/**
 * POST /commentsOfPhoto/:photo_id - Add a comment to a photo
 */
app.post("/commentsOfPhoto/:photo_id", requireAuth, async (request, response) => {
  const { photo_id } = request.params;
  const { comment } = request.body;

  // Validate photo_id
  if (!mongoose.Types.ObjectId.isValid(photo_id)) {
    return response.status(400).send("Invalid photo ID");
  }

  // Validate comment is not empty
  if (!comment || !comment.trim()) {
    return response.status(400).send("Comment cannot be empty");
  }

  try {
    // Find the photo
    const photo = await Photo.findById(photo_id);
    if (!photo) {
      return response.status(404).send("Photo not found");
    }

    // Create the new comment
    const newComment = {
      comment: comment.trim(),
      date_time: new Date(),
      user_id: request.session.user._id
    };

    // Add comment to photo
    photo.comments.push(newComment);
    await photo.save();

    // Return the newly created comment with user info
    const user = await User.findById(request.session.user._id, '_id first_name last_name');
    const commentWithUser = {
      _id: photo.comments[photo.comments.length - 1]._id,
      comment: newComment.comment,
      date_time: newComment.date_time,
      user: user
    };

    // Log activity
    await logActivity(io, { user: request.session.user, type: "COMMENT", photo });

    return response.status(200).json(commentWithUser);
  } catch (err) {
    console.error("Error adding comment:", err);
    return response.status(500).send("Server error");
  }
});

/**
 * POST /photos/new - Upload a new photo for the current user
 */
app.post("/photos/new", requireAuth, upload.single('photo'), async (request, response) => {
  // Check if a file was uploaded
  if (!request.file) {
    return response.status(400).send("No file uploaded");
  }

  try {
    // Parse sharing_list from the formData
    let sharingList;

    if (request.body.sharing_list === "null" || request.body.sharing_list === undefined) {
      // Public
      sharingList = undefined;
    } else {
      // [] or [userIDs]
      sharingList = JSON.parse(request.body.sharing_list);
    }
    
    // Create new photo document
    const newPhoto = await Photo.create({
      file_name: request.file.filename,
      date_time: new Date(),
      user_id: request.session.user._id,
      comments: [],
      sharing_list: sharingList,
    });

    // Log activity
    await logActivity(io, { user: request.session.user, type: "PHOTO_UPLOAD", photo: newPhoto });

    return response.status(200).json({
      _id: newPhoto._id,
      file_name: newPhoto.file_name,
      date_time: newPhoto.date_time,
      user_id: newPhoto.user_id,
      sharing_list: newPhoto.sharing_list
    });
  } catch (err) {
    console.error("Error uploading photo:", err);
    // Delete the uploaded file if database insertion fails
    if (request.file) {
      fs.unlink(join(__dirname, 'images', request.file.filename), (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file:", unlinkErr);
      });
    }
    return response.status(500).send("Server error");
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

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true }
});

export default io;