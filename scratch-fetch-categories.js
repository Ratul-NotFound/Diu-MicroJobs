const http = require('http');

http.get('http://localhost:3000/api/categories', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Status code:', res.statusCode);
      if (parsed.categories) {
        console.log('Total categories returned by API:', parsed.categories.length);
        console.log('Names:', parsed.categories.map(c => c.name));
      } else {
        console.log('No categories array in response:', parsed);
      }
    } catch (err) {
      console.error('Failed to parse JSON response:', err.message);
      console.log('Raw data preview:', data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
