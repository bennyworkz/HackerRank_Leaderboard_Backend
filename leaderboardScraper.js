const axios = require('axios');
const XLSX = require('xlsx');

async function fetchLeaderboardPage(contestSlug, password, offset = 0, limit = 100) {
  const apiUrl = `https://www.hackerrank.com/rest/contests/${contestSlug}/leaderboard`;
  const params = { offset, limit, _: Date.now() };
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-US,en;q=0.9',
    'x-requested-with': 'XMLHttpRequest'
  };

 
  if (password) {
    headers['Authorization'] = `Basic ${Buffer.from(`:${password}`).toString('base64')}`;
  }

  try {
    const response = await axios.get(apiUrl, { params, headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data (offset ${offset}):`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

async function fetchAllLeaderboardData(contestSlug, password) {
  let allData = [];
  let offset = 0;
  let total;

  
  const firstPage = await fetchLeaderboardPage(contestSlug, password, offset);
  if (!firstPage) return allData;

  total = firstPage.total;
  allData = allData.concat(firstPage.models);
  console.log(`Total entries: ${total}`);

  
  const pageSize = 100; 
  const totalPages = Math.ceil(total / pageSize);

 
  for (let page = 1; page < totalPages; page++) {
    offset = page * pageSize;
    const data = await fetchLeaderboardPage(contestSlug, password, offset, pageSize);
    if (data && data.models) {
      allData = allData.concat(data.models);
      console.log(`Fetched ${allData.length} out of ${total} entries...`);
    } else {
      console.error(`Failed to fetch page ${page + 1}`);
    }

    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return allData;
}

function formatTimeTaken(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function scrapeLeaderboard(contestSlug, password) {
  try {
    const allData = await fetchAllLeaderboardData(contestSlug, password);
    
    if (!allData || allData.length === 0) {
      throw new Error('No data fetched. The contest might be private, require a different password, or use a different authentication method.');
    }

   
    const formattedData = allData
      .sort((a, b) => a.rank - b.rank)
      .map(model => ({
        Rank: model.rank || 'N/A',
        User: model.hacker || 'N/A',
        'Solved Count': model.solved_challenges || 'N/A',
        'Time Taken': model.time_taken ? formatTimeTaken(model.time_taken) : 'N/A'
      }));

   
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");

   
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return { data: formattedData, excelBuffer };
  } catch (error) {
    console.error('Failed to fetch and process leaderboard:', error);
    throw error;
  }
}

module.exports = { scrapeLeaderboard };
