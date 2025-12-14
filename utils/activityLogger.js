import Activity from "../schema/activity.js";

async function logActivity(io, { user, type, photo }) {
  const activity = await Activity.create({
    type,
    user_id: user._id,
    photo_id: photo?._id || null,
    created_at: new Date(),
  });

  const populatedActivity = await Activity.findById(activity._id)
    .populate('user_id', '_id first_name last_name')
    .populate('photo_id', 'file_name')
    .lean();

  io.emit("newActivity", populatedActivity);

  return activity;
}

export default logActivity;