import { Router, type IRouter } from "express";

const router: IRouter = Router();

const PYTHON_API = "http://localhost:8081";

router.post("/assemble", async (req, res) => {
  try {
    const upstream = await fetch(`${PYTHON_API}/assemble`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to proxy /assemble to Python API");
    res.status(502).json({ detail: "Board API unavailable" });
  }
});

export default router;
