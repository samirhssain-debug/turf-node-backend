const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { scrapeZoneTurf } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Turf Scraper API is running',
    endpoints: ['/api/race/:date']
  });
});

app.get('/api/race/:date', async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{8}$/.test(date)) {
      return res.status(400).json({ error: 'Date format must be YYYYMMDD' });
    }
    const data = await scrapeZoneTurf(date);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Scraping failed', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
