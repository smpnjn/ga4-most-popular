
import { BetaAnalyticsDataClient } from '@google-analytics/data';
// Creates a client.

const analyticsDataClient = new BetaAnalyticsDataClient({
    keyFile: './key.json' 
});

let GaFunction = async function() {
    let propertyId = '<<PUT YOUR PROPERTY ID HERE>>';
    // Get the day 31 days ago
    let today = new Date().getTime() - (60 * 60 * 24 * 31 * 1000);
    // Get the day, month and year
    let day = new Date(today).getDate();
    let month = new Date(today).getMonth() + 1;
    let year = new Date(today).getFullYear();
    // Put it in Google's date format
    let dayFormat = `${year}-${month}-${day}`;
    const [response] = await analyticsDataClient.runReport({
        property: 'properties/' + propertyId,
        dateRanges: [
        {
            // Run from today to 31 days ago
            startDate: dayFormat,
            endDate: 'today',
        }
        ],
        dimensions: [
        {
            // Get the page path
            name: 'pagePath',
        },
        {
            // And also get the page title
            name: 'pageTitle'
        }
        ],
        metrics: [
        {
            // And tell me how many active users there were for each of those
            name: 'activeUsers',
        },
        ],
    });

    // newObj will contain the views, url and title for all of our pages. You may have to adjust this for your own needs.
    let newObj = [];
    response.rows.forEach(row => {
        // dimensionValues[0] contains 'pagePath', and dimensionsValues[1] contains 'pageTitle'
        // We will remove and percentages from the end of URLs to clean them up. You may have to adjust this
        // If you make use of percentages normally in your URLs.
        if(typeof row.dimensionValues[0].value.split('%')[1] !== "undefined") {
            row.dimensionValues[0].value = row.dimensionValues[0].value.split('%')[0];   
        }
        // We will remove the domain title from the start of the pageTitle from dimensionValues[1], to only give
        // us the page title. Again, you may have to change 'Fjolt -' to something else, or remove this entirely.
        if(typeof row.dimensionValues[1].value.split('Fjolt - ')[1] !== "undefined") {
            row.dimensionValues[1].value = row.dimensionValues[1].value.split('Fjolt - ')[1];
        }
        // We only want articles that have URLs starting with /article/
        if(typeof row.dimensionValues[0].value.split('/article/')[1] !== "undefined") {
            // This function will push an object with the url, views and title for any /article/ page. 
            // If the article already exists in 'newObj', we will update it and add the views onto the old one
            // So we have one entry only for each article.
            if(typeof row.dimensionValues[0].value.split('?')[1] !== "undefined") {
                let findEl = newObj.find(el => el.url == row.dimensionValues[0].value.split('?')[0]);
                if(typeof findEl == "undefined") {
                    newObj.push({
                        url: row.dimensionValues[0].value.split('?')[0],
                        views: row.metricValues[0].value,
                        title: row.dimensionValues[1].value
                    });
                } else {
                    findEl.views = `${parseFloat(findEl.views) + parseFloat(row.metricValues[0].value)}`;
                }
            } else {
                newObj.push({
                    url: row.dimensionValues[0].value,
                    views: row.metricValues[0].value,
                    title: row.dimensionValues[1].value
                });
            }
        }
    });
    // We will order the articles by their view count using sort()
    // This will give us a list of articles from highest to lowest view count.
    newObj.sort((a,b) => (parseFloat(a.views) < parseFloat(b.views)) ? 1 : ((parseFloat(b.views) > parseFloat(a.views)) ? -1 : 0))
    // I only want the top 7 articles, so I'm splicing that off the top.
    newObj.splice(7, newObj.length);
    
    let html = '<h2><i class="fas fa-fire-alt"></i> Recently Popular</h2><ol>';
    newObj.forEach(function(item) {
        html += `<li><a href="${item.url}">${item.title}</a></li>`
    });
    html += '</ol>';
    return html;
}
