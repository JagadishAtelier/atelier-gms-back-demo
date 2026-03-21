import User from "../user/models/user.model.js";

const demoCheck = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Update demo_expired if past demo_end
    if (user.demo_end && new Date() > user.demo_end && !user.demo_expired) {
      await user.update({ demo_expired: true });
    }

    if (user.demo_expired) {
      return res
        .status(403)
        .json({ error: "Your demo has ended. Please contact support." });
    }

    next(); // demo is still valid
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export default demoCheck;