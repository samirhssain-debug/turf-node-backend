const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const UserAgents = require('user-agents');

const cache = new NodeCache({ stdTTL: 3600 });
const userAgent = new UserAgents().toString();

async function scrapeZoneTurf(date) {
  const cacheKey = `race_${date}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `https://www.zoneturf.fr/programme-pmu/${date}`;
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.zoneturf.fr/'
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const races = [];

    $('.course-row').each((i, elem) => {
      const race = {
        name: $(elem).find('.course-name').text().trim(),
        time: $(elem).find('.course-time').text().trim(),
        hippodrome: $(elem).find('.hippodrome').text().trim(),
        horses: []
      };

      $(elem).find('.partant-line').each((j, horseElem) => {
        race.horses.push({
          number: $(horseElem).find('.numero').text().trim(),
          name: $(horseElem).find('.cheval').text().trim(),
          jockey: $(horseElem).find('.jockey').text().trim(),
          trainer: $(horseElem).find('.entraineur').text().trim(),
          odds: $(horseElem).find('.cote').text().trim()
        });
      });
      
      if (race.name) races.push(race);
    });

    const result = { date, races, count: races.length, source: 'zoneturf.fr' };
    cache.set(cacheKey, result);
    return result;
    
  } catch (error) {
    throw new Error(`Scraping failed: ${error.message}`);
  }
}

module.exports = { scrapeZoneTurf };
