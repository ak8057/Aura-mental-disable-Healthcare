import User from "../models/userModel.js"; // Adjust the path as necessary
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "../utils/appError.js";

// Register User
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log("Signup request received:", { name, email });

    const userExists = await User.findOne({ email });
    console.log("Checking if user exists:", userExists);

    if (userExists) {
      return next(new createError("User already exists!", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name, email, password: hashedPassword });
    console.log("New user created:", newUser);

    const token = jwt.sign({ _id: newUser._id }, "secretkey123", { expiresIn: "90d" });

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Login request received:", { email });

    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      return next(new createError("User not found!", 404));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
      return next(new createError("Invalid Email or Password", 401));
    }

    const token = jwt.sign({ _id: user._id }, "secretkey123", { expiresIn: "90d" });

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    next(error);
  }
};

export default { signup, login };
