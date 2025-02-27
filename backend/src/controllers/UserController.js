const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const AppDataSource = require('../data-source');

const User = require("../models/User")

const register = async (req, res) => {
    const { name, email, password, role } = req.body;
  
    console.log('Registration request received:', { name, email, role });
  
    try {
      const userRepository = AppDataSource.getRepository(User);

  
      // Check if the user already exists
      console.log('Checking if user exists...');
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        console.log('User already exists:', existingUser);
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Hash the password
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user
      console.log('Creating user...');
      const user = userRepository.create({
        name,
        email,
        password: hashedPassword,
        role,
      });
  
      // Save the user to the database
      
      await userRepository.save(user);
      console.log('User saved successfully:', user);
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  const login = async (req, res) => {
    const { email, password } = req.body;
  
    console.log('Login request received:', { email });
  
    try {
    
      const userRepository = AppDataSource.getRepository(User);

  
      // Find the user by email
      console.log('Finding user by email...');
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        console.log('User not found');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Compare passwords
      console.log('Comparing passwords...');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Passwords do not match');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Generate a JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      console.log('Login successful');
      res.status(200).json({ token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

module.exports = {register, login};