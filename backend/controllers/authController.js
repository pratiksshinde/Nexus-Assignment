const bcrypt = require("bcryptjs");
const { UniqueConstraintError } = require("sequelize");
const { sequelize, Workspace, User } = require("../models");
const generateToken = require("../utils/generateToken");
const setAuthCookie = require("../utils/setAuthCookie");

const register = async (req, res, next) => {
  let transaction;

  try {
    const { name, email, password, company_name } = req.body;

    if (![name, email, password, company_name].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and company name are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    const normalizedEmail = email.trim().toLowerCase();
    transaction = await sequelize.transaction();

    const existingUser = await User.findOne({
      where: {
        email: normalizedEmail,
      },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "An account already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const workspace = await Workspace.create(
      {
        name: company_name.trim(),
      },
      { transaction }
    );

    const user = await User.create(
      {
        workspace_id: workspace.id,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
      { transaction }
    );

    await transaction.commit();

    const token = generateToken({
      user_id: user.id,
      workspace_id: workspace.id,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          workspace_id: workspace.id,
          workspace_name: workspace.name,
        },
      },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email",
      });
    }

    next(error);
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.scope("withPassword").findOne({
      where: {
        email: normalizedEmail,
      },
      include: [
        {
          model: Workspace,
          as: "workspace",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      user_id: user.id,
      workspace_id: user.workspace_id,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          workspace_id: user.workspace_id,
          workspace_name: user.workspace.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
