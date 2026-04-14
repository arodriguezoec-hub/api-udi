export default async function handler(req, res) {
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

    const parsed = datos.map(d => {
      const [day, month, year] = d.fecha.split("/");
      const isoDate = `${year}-${month}-${day}`;

      return {
        isoDate,
        rawDate: d.fecha,
        value: d.dato === "N/E" ? null : parseFloat(d.dato)
      };
    });

    const todayISO = new Date().toISOString().split("T")[0];

    const closest = parsed
      .filter(d => d.value !== null && d.isoDate <= todayISO)
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate))[0];

    return res.status(200).json({
      date: closest?.rawDate || null,
      value: closest?.value || null
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch UDI",
      details: error.message
    });
  }
}