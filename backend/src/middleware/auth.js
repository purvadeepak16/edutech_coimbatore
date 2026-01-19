import admin from "../config/firebase.js";

export default async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      id: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
