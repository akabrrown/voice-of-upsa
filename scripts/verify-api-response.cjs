
const fetch = require('node-fetch');

async function checkApi() {
  try {
    const response = await fetch('http://localhost:3000/api/articles');
    const data = await response.json();
    
    if (!data.success) {
      console.error('API Error:', data);
      return;
    }

    const articles = data.data.articles;
    console.log(`Found ${articles.length} articles.`);

    articles.forEach(article => {
        console.log(`[ARTICLE] Title: ${article.title}`);
        console.log(`   - contributor_name: '${article.contributor_name}'`);
        console.log(`   - author.name:      '${article.author?.name}'`);
    });

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

checkApi();
