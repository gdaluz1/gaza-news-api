console.log('Thank you for using WebStorm 💙');

const PORT = 8000;
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

const newspapers = [
    { name: 'thetimes', address: 'https://www.thetimes.com' },
    { name: 'guardian', address: 'https://www.theguardian.com/world/middleeast' },
    { name: 'telegraph', address: 'https://www.telegraph.co.uk' },
    { name: 'nytimes', address: 'https://www.nytimes.com' } // Added The New York Times
];

let articles = [];

newspapers.forEach(newspaper => {
    axios.get(newspaper.address)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);

            if (newspaper.name === 'thetimes') {
                $('a.js-tracking').each(function () {
                    const href = $(this).attr('href');
                    const fullUrl = href.startsWith('http') ? href : `${newspaper.address}${href}`;

                    // Remove any child elements (e.g., <img>) and get the pure text
                    const title = $(this).clone().children().remove().end().text().trim();

                    // Check if "Gaza" is present in the title
                    if (/\bGaza\b/i.test(title)) {
                        // Check for duplicate URLs
                        if (articles.some(article => article.url === fullUrl)) {
                            console.log(`Duplicate URL found and skipped: ${fullUrl}`);
                        } else {
                            articles.push({
                                title: title,
                                url: fullUrl,
                                source: newspaper.name
                            });
                        }
                    }
                });
            } else if (newspaper.name === 'nytimes') {
                // Specific handling for New York Times to capture <p> with class "summary-class css-1l5zmz6"
                $('p.summary-class.css-1l5zmz6').each(function () {
                    const title = $(this).text().trim();

                    // As we are dealing with paragraphs, no direct URL to article, so we use base URL
                    const fullUrl = newspaper.address;

                    // Check if "Gaza" is present in the paragraph text
                    if (/\bGaza\b/i.test(title)) {
                        articles.push({
                            title: title,
                            url: fullUrl,
                            source: newspaper.name
                        });
                    }
                });
            } else {
                // For other newspapers, collecting standard articles as before
                $('a').each(function () {
                    let title = $(this).attr('aria-label') || $(this).text().trim();
                    let url = $(this).attr('href');

                    // Check if "Gaza" is present in the title and ensure it's an article or live update
                    if (/\bGaza\b/i.test(title) && url && (url.includes('/article/') || url.includes('/live/'))) {
                        if (!url.startsWith('http')) {
                            url = `${newspaper.address}${url}`;
                        }

                        // Avoid adding duplicates
                        if (articles.some(article => article.url === url)) {
                            console.log(`Duplicate URL found and skipped: ${url}`);
                        } else {
                            articles.push({
                                title: title,
                                url: url,
                                source: newspaper.name
                            });
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error(`Error fetching data from ${newspaper.name}:`, error);
        });
});

app.get('/', (req, res) => {
    res.json('Welcome to my Gaza NEWS API');
});

app.get('/news', (req, res) => {
    res.json(articles); // Return the array of articles as JSON
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));