const jwt = require("jsonwebtoken");
const { User, Workspace } = require("../models");

async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.access_token;

    // Optional support for Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Session expired. Please log in again"
            : "Invalid authentication token",
      });
    }

    const user = await User.findOne({
      where: {
        id: decoded.user_id,
        workspace_id: decoded.workspace_id,
      },
      attributes: ["id", "workspace_id", "name", "email"],
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
        message: "User account no longer exists",
      });
    }

    req.user = {
      id: user.id,
      user_id: user.id,
      workspace_id: user.workspace_id,
      name: user.name,
      email: user.email,
      workspace: user.workspace,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;