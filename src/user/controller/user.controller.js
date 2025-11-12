// // controllers/user.controller.js
// import userService from "../service/user.service.js";
// import { registerSchema, userLoginSchema } from "../dto/user.dto.js";

// const userController = {
//   // 🔹 Register
//   async register(req, res) {
//     try {
//       // Validate request
//       const data = registerSchema.body.parse(req.body);

//       const user = await userService.register(data);
//       return res.status(201).json({ message: "User registered", user });
//     } catch (err) {
//       return res.status(400).json({ error: err.message || err.errors });
//     }
//   },

//   // 🔹 Login
//   async login(req, res) {
//     try {
//       const data = userLoginSchema.body.parse(req.body);

//       // Here, identifier can be email or phone
//       const identifier = data.identifier;
//       const password = data.password;

//       const result = await userService.login({ identifier, password });
//       return res.json({ message: "Login successful", ...result });
//     } catch (err) {
//       return res.status(400).json({ error: err.message || err.errors });
//     }
//   },

//   // 🔹 Get User Profile
//   async profile(req, res) {
//     try {
//       const user = await userService.getUserById(req.params.id);
//       return res.json({ user });
//     } catch (err) {
//       return res.status(404).json({ error: err.message });
//     }
//   },
// };

// export default userController;


import userService from "../service/user.service.js";
import {
  registerSchema,
  userLoginSchema,
  updateUserSchema,
} from "../dto/user.dto.js";

const userController = {
  async createUser(req, res) {
    try {
      const payload = {
        ...req.body,
        role: req.body.role,
      };
      const data = registerSchema.body.parse(payload);
      const user = await userService.createUser(data);
      res.status(201).json({ message: "User created", user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getUsers(req, res) {
    const users = await userService.getUsers();
    res.json(users);
  },

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json(user);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async getMe(req, res) {
    try {
      const user = await userService.getMe(req.user.id);
      res.json(user);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async loginUser(req, res) {
    try {
      console.log("Incoming Request Form the Request Body :", req.body);
      const data = userLoginSchema.body.parse(req.body);
      console.log("Parsed Data ;", data);
      if (!data.identifier || !data.password) return res.status(400).json({ error: "Identifier and password are required" });


      const result = await userService.loginUser(data);
      res.json({ message: `Login success`, ...result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateUserById(req, res) {
    try {
      const data = updateUserSchema.body.parse(req.body);
      const user = await userService.updateUserById(
        req.params.id,
        data,
        req.user.id
      );
      res.json({ message: "User updated", user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async softDeleteUser(req, res) {
    try {
      await userService.softDeleteUser(req.params.id, req.user.id);
      res.json({ message: "User soft deleted" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async restoreUser(req, res) {
    try {
      await userService.restoreUser(req.params.id);
      res.json({ message: "User restored" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async refreshAccessToken(req, res) {
    try {
      const token = await userService.refreshAccessToken(req.user.id);
      res.json({ token });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async logoutUser(req, res) {
    try {
      await userService.logoutUser(req.user.id);
      res.json({ message: "Logged out" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async sendOtpToken(req, res) {
    try {
      const otp = await userService.sendOtpToken(req.body.identifier);
      res.json({ message: "OTP sent", otp });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async userAlreadyExists(req, res) {
    const exists = await userService.userAlreadyExists(req.query.email);
    res.json({ exists });
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      await userService.changePassword(req.user.id, oldPassword, newPassword);
      res.json({ message: "Password changed" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

export default userController;
