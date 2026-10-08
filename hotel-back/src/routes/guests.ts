import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({ success: true, guests: [] });
});

router.post("/", (req, res) => {
  const guest = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    ...req.body,
  };
  return res.json({ success: true, guest });
});

router.delete("/:id", (_req, res) => {
  return res.json({ success: true });
});

export default router;
