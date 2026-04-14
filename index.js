console.log("Starting server...");

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

const PORT = 3000;

app.get("/api/udi", async (req, res) => {
  try {
const today = new Date();
const past = new Date();
past.setDate(today.getDate() - 7);

const format = (d) => d.toISOString().split("T")[0];

const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257/datos/${format(past)}/${format(today)}`;

const response = await fetch(url, {
  headers: {
    "Bmx-Token": process.env.BANXICO_TOKEN
  }
});

const data = await response.json();
const datos = data.bmx.series[0].datos;

// ✅ NEW parsed (string-based, no timezone issues)
const parsed = datos.map(d => {
  const [day, month, year] = d.fecha.split("/");
  const isoDate = `${year}-${month}-${day}`;

  return {
    isoDate,
    rawDate: d.fecha,
    value: d.dato === "N/E" ? null : parseFloat(d.dato)
  };
});

// ✅ Correct comparison
const todayISO = today.toISOString().split("T")[0];

const closest = parsed
  .filter(d => d.value !== null && d.isoDate <= todayISO)
  .sort((a, b) => b.isoDate.localeCompare(a.isoDate))[0];

res.json({
  date: closest?.rawDate || null,
  value: closest?.value || null
});

  } catch (error) {
    console.error("FULL ERROR:", error);

    res.status(500).json({
      error: "Failed to fetch UDI",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});