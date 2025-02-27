const AppDataSource = require('../data-source');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');


// Send a notification to a user
const sendNotification = async (req, res) => {
  const { user_id, message } = req.body;

  console.log('Sending notification to user:', user_id);

  try {
    const notificationRepository = AppDataSource.getRepository(Notification);

    // verify the user exists
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({where:{id: user_id}});
    if (!user){
      console.log('User not found');
      return res.status(404).json({message: 'User not found'});
    }
    // Create a new notification
    const notification = notificationRepository.create({
      user_id,
      message,
    });

    // Save the notification to the database
    await notificationRepository.save(notification);
    console.log('Notification sent successfully:', notification);

    // Send an email to the user
     await sendEmail(user.email, 'New Notification', message);
    
    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all notifications for a user
const getNotificationsByUser = async (req, res) => {
  const { user_id } = req.params;

  console.log('Fetching notifications for user:', user_id);

  try {
    const notificationRepository = AppDataSource.getRepository(Notification);

    // Fetch all notifications for the user
    const notifications = await notificationRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' }, // Show latest notifications first
    });

    res.status(200).json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendNotification,
  getNotificationsByUser,
};