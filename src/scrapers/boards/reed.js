const axios = require('axios');
const cheerio = require('cheerio');
const Search = require('../../models/Search');


const reedScraper = async (searchTitle, searchLocation, searchRadius, searchTimeScale, id) => {

    switch(searchRadius) {
        case '1 Mile':
            searchRadius = '1';
            break;
        case '5 Miles':
            searchRadius = '5';
            break;
        case '10 Miles':
            searchRadius = '10';
            break;
        case '15 Miles':
            searchRadius = '15';
            break;
        case '20 Miles':
            searchRadius = '20';
            break;
        default:
            searchRadius = '30';

    }

    switch(searchTimeScale) {
        case '1 Day':
            searchTimeScale = 'Today';
            break;
        case '3 Days':
            searchTimeScale = 'LastThreeDays';
            break;
        case '7 Days':
            searchTimeScale = 'LastWeek';
            break;
        case '14 Days':
            searchTimeScale = 'LastTwoWeeks';
            break;
        default:
            searchTimeScale = 'Anytime';

    }

    const jobs = [];

    let reed = await axios.get(`https://www.reed.co.uk/jobs/${searchTitle}-jobs-in-${searchLocation}?datecreatedoffset=${searchTimeScale}&proximity=${searchRadius}`);

    $ = cheerio.load(reed.data);

    $('.details').each((index, element) => {
                        const title = $(element)
                            .find('h3')
                            .text()
                            .trim();
                        
                        const company = $(element)
                            .find('.gtmJobListingPostedBy')
                            .text()
                            .trim();
                        
                        const location = $(element)
                            .find('.location')
                            .text()
                            .trim()
                            .replace('\n', '');
                        
                        const link = $(element)
                            .find('.title')
                            .children('a')
                            .attr('href');
        
                            job = { title, company, location, link: (['https://www.reed.co.uk', link].join('')), source: 'Reed'}

                            jobs.push(job);
        
    })

    const checkedJobs = [];
    
    jobs.forEach(job => {

    const capitalizedTitle = searchTitle.charAt(0).toUpperCase() + searchTitle.slice(1)
    
                if(job.title.includes(capitalizedTitle)) {
                    checkedJobs.push(job)
                } else {
                    console.log(`[Rejected Job] ${job.title} - ${job.source}`)
                }
            });

    const currentSearch = await Search.findOne({ id }).exec();

    if(currentSearch !== null) {
        const filter = { id };
        const update = { jobs: [ ...currentSearch.jobs, ...checkedJobs ] };
        await Search.findOneAndUpdate(filter, update, { returnOriginal: false, useFindAndModify: false } );
    } else {
        const search = new Search({
            id,
            jobs: checkedJobs
        });
        await search.save();
    }

}

module.exports = reedScraper