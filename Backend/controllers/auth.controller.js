import User from "../models/User.model.js";
import { generateToken } from "../utils/generateToken.js";

// @desc    Register a new user (consumer)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user (always consumer role)
    const user = await User.create({
      name,
      email,
      password,
      role: "consumer",
    });

    if (user) {
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Search users (for tagging)
// @route   GET /api/auth/search?q=query
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Search users by name or email (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Seed default creator (for initial setup)
// @route   POST /api/auth/seed-creator
// @access  Public (should be protected in production)
export const seedCreator = async (req, res) => {
  try {
    const creatorEmail = "creator@mini.com";
    const creatorPassword = "creator123";

    // Check if creator already exists
    const creatorExists = await User.findOne({ email: creatorEmail });

    if (creatorExists) {
      return res.status(200).json({
        success: true,
        message: "Creator already exists",
        data: {
          user: {
            id: creatorExists._id,
            name: creatorExists.name,
            email: creatorExists.email,
            role: creatorExists.role,
          },
        },
      });
    }

    // Create creator
    const creator = await User.create({
      name: "Creator",
      email: creatorEmail,
      password: creatorPassword,
      role: "creator",
    });

    res.status(201).json({
      success: true,
      message: "Creator seeded successfully",
      data: {
        user: {
          id: creator._id,
          name: creator.name,
          email: creator.email,
          role: creator.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
