const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const rawAuth = req.headers["authorization"];
  if (!rawAuth) return res.status(401).json({ msg: "No token" });
  const token = rawAuth.startsWith("Bearer ") ? rawAuth.slice(7) : rawAuth;

  jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me", (err, decoded) => {
    if (err) return res.status(403).json({ msg: "Invalid token" });
    req.user = decoded;
    next();
  });
};
